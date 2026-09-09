import os
import re
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers
from . import models


# Spanish labels for each model's choice fields (mirrors the Choices tuples).
ES_CHOICE_LABELS = {
    "TeamStatus.status": {
        models.TeamStatus.READY: "Listo para Despliegue",
        models.TeamStatus.TRAINING: "Capacitación en Progreso",
        models.TeamStatus.DEPLOYED: "Despliegue Activo",
    },
    "NewsUpdate.category": {
        "news": "Actualización del Equipo",
        "dispatch": "Registro de Despacho",
        "exercise": "Ejercicio de Capacitación",
    },
    "Partner.partner_type": {
        "agency": "Agencia Patrocinadora",
        "fire_department": "Departamento de Bomberos",
        "ngo": "ONG / Socio Sin Fines de Lucro",
    },
}


class LookupKeyField(serializers.Field):
    """Represents a relationship to a lookup table by its key string.

    Reads as the lookup row's ``status`` key (e.g. "active", "A+") so existing
    frontend comparisons/filters keep working; writes accept either that key
    or the numeric id. Used for Member.status, Member.blood_type,
    Deployment.status and Capability.category.
    """

    default_error_messages = {"invalid": "Invalid lookup value."}

    def __init__(self, lookup_model, *args, **kwargs):
        self.lookup_model = lookup_model
        if "allow_null" not in kwargs:
            kwargs["allow_null"] = True
        super().__init__(*args, **kwargs)

    def to_representation(self, value):
        if value is None:
            return None
        return value.status

    def to_internal_value(self, data):
        if data in (None, ""):
            return None
        try:
            return self.lookup_model.objects.get(status=data)
        except (self.lookup_model.DoesNotExist, ValueError, TypeError):
            try:
                return self.lookup_model.objects.get(pk=data)
            except (self.lookup_model.DoesNotExist, ValueError, TypeError):
                self.fail("invalid")


class TranslatedFieldsMixin:
    """Provides ``_get_lang`` and ``_get_choice_display`` helpers to serializers."""

    def _get_lang(self):
        request = self.context.get("request", None)
        return request.query_params.get("lang", "en") if request else "en"

    def _get_choice_display(self, obj, field_name, choices):
        raw = getattr(obj, field_name)
        lang = self._get_lang()
        key = f"{obj.__class__.__name__}.{field_name}"
        if lang == "es":
            return ES_CHOICE_LABELS[key].get(raw, raw)
        return dict(choices).get(raw, raw)


def translated_method(attr):
    """Returns a bound SerializerMethodField getter that respects lang."""

    def getter(self, obj):
        lang = self._get_lang()
        en = getattr(obj, attr)
        es = getattr(obj, f"{attr}_es", "") or ""
        if lang == "es" and es:
            return es
        return en

    return getter


def translated_list_method(attr):
    """Like translated_method but splits a newline-separated field into a list."""

    def getter(self, obj):
        lang = self._get_lang()
        en = getattr(obj, attr)
        es = getattr(obj, f"{attr}_es", "") or ""
        text = es if (lang == "es" and es) else en
        return [line.strip() for line in text.splitlines() if line.strip()]

    return getter


def _lookup_label(lookup, lang):
    """Translated title for a lookup-table row (status/note/note_es triples)."""
    if lookup is None:
        return ""
    if lang == "es" and lookup.note_es:
        return lookup.note_es
    return lookup.note or lookup.status


class LookupSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    """Base for the four lookup tables; exposes a translated label."""

    label = serializers.SerializerMethodField()

    def get_label(self, obj):
        lang = self._get_lang()
        if lang == "es" and obj.note_es:
            return obj.note_es
        return obj.note or obj.status


class TeamStatusSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    status_display = serializers.SerializerMethodField()
    note = serializers.SerializerMethodField()

    class Meta:
        model = models.TeamStatus
        fields = ["id", "status", "status_display", "note", "note_es", "updated_at"]

    get_note = translated_method("note")

    def get_status_display(self, obj):
        return self._get_choice_display(obj, "status", models.TeamStatus.STATUS_CHOICES)


class ImpactMetricSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    label = serializers.SerializerMethodField()

    class Meta:
        model = models.ImpactMetric
        fields = ["id", "label", "label_es", "value", "order"]

    get_label = translated_method("label")


class CapabilitySerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()

    category = LookupKeyField(models.CapabilityCategory, required=False)

    class Meta:
        model = models.Capability
        fields = [
            "id", "category", "category_display", "title", "title_es", "summary",
            "summary_es", "description", "description_es", "order",
        ]

    get_title = translated_method("title")
    get_summary = translated_method("summary")
    get_description = translated_method("description")

    def get_category_display(self, obj):
        return _lookup_label(obj.category, self._get_lang())


class NewsUpdateSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()

    class Meta:
        model = models.NewsUpdate
        fields = [
            "id", "title", "title_es", "category", "category_display", "summary",
            "summary_es", "body", "body_es", "published_at", "is_published",
        ]

    get_title = translated_method("title")
    get_summary = translated_method("summary")
    get_body = translated_method("body")

    def get_category_display(self, obj):
        return self._get_choice_display(obj, "category", models.NewsUpdate.CATEGORY_CHOICES)


class DeploymentSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    name = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    status = LookupKeyField(models.DeploymentStatus, required=False)

    class Meta:
        model = models.Deployment
        fields = [
            "id", "name", "name_es", "location", "location_es", "status", "status_display",
            "start_date", "end_date", "summary", "summary_es", "is_public", "map_area",
        ]

    get_name = translated_method("name")
    get_location = translated_method("location")
    get_summary = translated_method("summary")

    def get_status_display(self, obj):
        return _lookup_label(obj.status, self._get_lang())


class TrainingExerciseSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = models.TrainingExercise
        fields = ["id", "title", "title_es", "date", "description", "description_es", "partner_agencies"]

    get_title = translated_method("title")
    get_description = translated_method("description")


class HierarchySerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = models.Hierarchy
        fields = ["id", "name", "name_es", "description", "description_es", "order"]

    get_name = translated_method("name")
    get_description = translated_method("description")


class TeamRoleSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    hierarchy_name = serializers.SerializerMethodField()
    requirements_list = serializers.SerializerMethodField()

    class Meta:
        model = models.TeamRole
        fields = [
            "id", "hierarchy", "hierarchy_name", "title",
            "title_es", "summary", "summary_es", "requirements",
            "requirements_es", "requirements_list", "time_commitment",
        ]

    get_title = translated_method("title")
    get_summary = translated_method("summary")
    get_requirements_list = translated_list_method("requirements")

    def get_hierarchy_name(self, obj):
        if obj.hierarchy is None:
            return None
        lang = self._get_lang()
        if lang == "es" and obj.hierarchy.name_es:
            return obj.hierarchy.name_es
        return obj.hierarchy.name


class ApplicantPipelinePhaseSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = models.ApplicantPipelinePhase
        fields = [
            "id", "name", "name_es", "description", "description_es",
            "phase_number", "pipeline_key",
        ]

    get_name = translated_method("name")
    get_description = translated_method("description")


class ApplicationDocumentSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = models.ApplicationDocument
        fields = ["id", "kind", "kind_display", "file", "filename", "approved", "uploaded_at"]

    def get_filename(self, obj):
        return obj.file.name.split("/")[-1]


class MedicalDocumentSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()

    class Meta:
        model = models.MedicalDocument
        fields = ["id", "file", "filename", "approved", "uploaded_at"]

    def get_filename(self, obj):
        return obj.file.name.split("/")[-1]


class ApplicationPhaseCommentSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source="updated_by.username", read_only=True, default=None)

    class Meta:
        model = models.ApplicationPhaseComment
        fields = ["id", "phase", "text", "updated_by", "updated_by_name", "updated_at"]


class ApplicationChecklistItemSerializer(serializers.ModelSerializer):
    done_by_name = serializers.CharField(source="done_by.username", read_only=True, default=None)
    phase = serializers.CharField(read_only=True)
    label = serializers.CharField(read_only=True)
    phase_display = serializers.SerializerMethodField()

    class Meta:
        model = models.ApplicationChecklistItem
        fields = ["id", "definition", "phase", "phase_display", "label", "done", "done_by", "done_by_name", "done_at"]

    def get_phase_display(self, obj):
        return obj.definition.get_phase_display()


class ApplicationLogSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True, default=None)

    class Meta:
        model = models.ApplicationLog
        fields = ["id", "entry", "created_by", "created_by_name", "created_at"]


class VolunteerApplicationSerializer(serializers.ModelSerializer):
    """Public-facing serializer used for the Join form submission (create-only).

    Accepts the applicant fields plus optional multipart file lists:
        - documents     -> ApplicationDocument(kind=document)
        - certificates  -> ApplicationDocument(kind=certification)
    """

    role_interest_title = serializers.CharField(source="role_interest.title", read_only=True)
    documents = serializers.ListField(
        child=serializers.FileField(allow_empty_file=False), write_only=True, required=False
    )
    certificates = serializers.ListField(
        child=serializers.FileField(allow_empty_file=False), write_only=True, required=False
    )
    pipeline_phase = serializers.SerializerMethodField(read_only=True)

    def get_pipeline_phase(self, obj):
        return obj.pipeline_phase.pipeline_key if obj.pipeline_phase else None

    class Meta:
        model = models.VolunteerApplication
        fields = [
            "id", "application_code", "full_name", "email", "phone", "id_number", "country",
            "role_interest", "role_interest_title", "message", "submitted_at",
            "pipeline_phase", "documents", "certificates",
        ]
        read_only_fields = ["submitted_at", "application_code"]

    def validate(self, attrs):
        id_number = (attrs.get("id_number") or "").strip()
        country = attrs.get("country")
        if id_number:
            qs = models.VolunteerApplication.objects.filter(
                id_number__iexact=id_number, is_rejected=False
            )
            if country is not None:
                qs = qs.filter(country=country)
            if qs.exists():
                raise serializers.ValidationError(
                    {
                        "id_number":
                            "An application using this ID number and country already exists."
                    }
                )
        return attrs

    def _renamed_file(self, prefix, id_number, index, uploaded):
        ext = os.path.splitext(uploaded.name)[1] or ".pdf"
        name = f"{prefix}-{id_number}-{index:03d}{ext}"
        return SimpleUploadedFile(
            name,
            uploaded.read(),
            content_type=uploaded.content_type or "application/octet-stream",
        )

    def create(self, validated_data):
        documents = validated_data.pop("documents", []) or []
        certificates = validated_data.pop("certificates", []) or []
        application = super().create(validated_data)
        id_number = application.id_number or "APP"
        phase = (
            application.pipeline_phase.pipeline_key
            if application.pipeline_phase else models.VolunteerApplication.PHASE_APPLICATION
        )
        models.ensure_checklist_items(application, phase)
        for index, f in enumerate(documents, start=1):
            models.ApplicationDocument.objects.create(
                application=application,
                kind=models.VolunteerApplication.DOC_DOCUMENT,
                file=self._renamed_file("DOC", id_number, index, f),
            )
        for index, f in enumerate(certificates, start=1):
            models.ApplicationDocument.objects.create(
                application=application,
                kind=models.VolunteerApplication.DOC_CERTIFICATION,
                file=self._renamed_file("CER", id_number, index, f),
            )
        return application


class VolunteerApplicationAdminSerializer(serializers.ModelSerializer):
    """Staff-facing serializer with the full application + review state."""

    role_interest_title = serializers.CharField(source="role_interest.title", read_only=True)
    pipeline_phase = serializers.SerializerMethodField(read_only=True)
    pipeline_phase_display = serializers.SerializerMethodField(read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True, default=None)
    status = serializers.SerializerMethodField()
    documents = ApplicationDocumentSerializer(many=True, read_only=True)
    medical_documents = MedicalDocumentSerializer(many=True, read_only=True)
    comments = ApplicationPhaseCommentSerializer(many=True, read_only=True)
    checklist = ApplicationChecklistItemSerializer(many=True, read_only=True)
    logs = ApplicationLogSerializer(many=True, read_only=True)

    def get_pipeline_phase(self, obj):
        return obj.pipeline_phase.pipeline_key if obj.pipeline_phase else None

    def get_pipeline_phase_display(self, obj):
        return str(obj.pipeline_phase) if obj.pipeline_phase else ""

    def get_status(self, obj):
        if obj.is_rejected:
            return "rejected"
        key = obj.pipeline_phase.pipeline_key if obj.pipeline_phase else None
        if key == models.VolunteerApplication.PHASE_ACTIVE:
            return "active"
        return "in_progress"

    class Meta:
        model = models.VolunteerApplication
        fields = [
            "id", "application_code", "full_name", "email", "phone", "id_number", "country",
            "country_name",
            "role_interest", "role_interest_title", "message", "submitted_at",
            "pipeline_phase", "pipeline_phase_display", "is_flagged", "is_rejected", "reviewed",
            "archived", "status",
            "documents", "medical_documents", "comments", "checklist", "logs",
        ]
        read_only_fields = ["submitted_at", "application_code"]


class ApplicantPortalSerializer(serializers.Serializer):
    """Public status response for the applicant portal (no internal notes)."""

    application_code = serializers.CharField()
    full_name = serializers.CharField()
    email = serializers.CharField()
    role_interest_title = serializers.SerializerMethodField()
    pipeline_phase = serializers.SerializerMethodField()
    pipeline_phase_display = serializers.SerializerMethodField()
    submitted_at = serializers.DateTimeField()
    checklist = serializers.SerializerMethodField()

    def get_role_interest_title(self, obj):
        role = obj.role_interest
        return role.title if role else ""

    def get_pipeline_phase(self, obj):
        return obj.pipeline_phase.pipeline_key if obj.pipeline_phase else None

    def get_pipeline_phase_display(self, obj):
        return str(obj.pipeline_phase) if obj.pipeline_phase else ""

    def get_checklist(self, obj):
        phase = obj.pipeline_phase.pipeline_key if obj.pipeline_phase else None
        items = obj.checklist.filter(definition__phase=phase).order_by("definition__order", "id")
        return [{"label": it.label, "done": it.done} for it in items]


class AffiliationSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    name = serializers.SerializerMethodField()

    class Meta:
        model = models.Affiliation
        fields = ["id", "name", "name_es", "url", "logo"]

    get_name = translated_method("name")


class PartnerSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    name = serializers.SerializerMethodField()
    partner_type_display = serializers.SerializerMethodField()

    class Meta:
        model = models.Partner
        fields = ["id", "name", "name_es", "partner_type", "partner_type_display", "url", "logo"]

    get_name = translated_method("name")

    def get_partner_type_display(self, obj):
        return self._get_choice_display(obj, "partner_type", models.Partner.TYPE_CHOICES)


class FundingNeedSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    item = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = models.FundingNeed
        fields = [
            "id", "item", "item_es", "description", "description_es", "cost_estimate",
            "image", "is_fulfilled", "order",
        ]

    get_item = translated_method("item")
    get_description = translated_method("description")


class SponsorshipTierSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    name = serializers.SerializerMethodField()
    benefits_list = serializers.SerializerMethodField()

    class Meta:
        model = models.SponsorshipTier
        fields = ["id", "name", "name_es", "annual_amount", "benefits", "benefits_es", "benefits_list", "order"]

    get_name = translated_method("name")
    get_benefits_list = translated_list_method("benefits")


class MemberSerializer(serializers.ModelSerializer):
    status = LookupKeyField(models.MemberStatus, required=False)
    blood_type = LookupKeyField(models.BloodType, required=False)
    status_display = serializers.SerializerMethodField()
    role_title = serializers.CharField(source="role.title", read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True, default=None)
    certifications_list = serializers.SerializerMethodField()
    member_number = serializers.CharField(read_only=True, default="")

    class Meta:
        model = models.Member
        fields = [
            "id", "full_name", "email", "phone", "role", "role_title",
            "id_number", "country", "country_name", "blood_type",
            "status", "status_display", "joined_date", "certifications",
            "certifications_list", "photo", "notes", "member_number",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_status_display(self, obj):
        request = self.context.get("request", None)
        lang = request.query_params.get("lang", "en") if request else "en"
        return _lookup_label(obj.status, lang)

    def get_certifications_list(self, obj):
        return [line.strip() for line in obj.certifications.splitlines() if line.strip()]


class MemberPasswordSerializer(serializers.Serializer):
    """Staff-only password set for the login account linked to a member.

    The member uses this password (with their username) to sign in to the
    portal; admins reset it for them whenever it needs to change.
    """

    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs.get("new_password") != attrs.get("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "The two passwords do not match."}
            )
        return attrs


class MemberPortalSerializer(serializers.ModelSerializer):
    """Profile returned to a signed-in member.

    Displays the member's own data for editing; bilingual labels resolve
    against the active site language. `member_number` is the linked login
    username (the member's email address by default).
    """

    member_number = serializers.CharField(read_only=True)
    country = serializers.PrimaryKeyRelatedField(read_only=True)
    blood_type = LookupKeyField(models.BloodType, required=False)
    country_name = serializers.SerializerMethodField()
    role_title = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    certifications_list = serializers.SerializerMethodField()
    joined_date = serializers.DateField(format="%Y-%m-%d")

    class Meta:
        model = models.Member
        fields = [
            "member_number", "full_name", "email", "phone", "id_number",
            "country", "country_name", "blood_type", "role_title",
            "status", "status_display", "joined_date", "certifications",
            "certifications_list", "notes", "photo", "created_at",
        ]

    def get_country_name(self, obj):
        country = obj.country
        if country is None:
            return None
        lang = self._get_lang()
        if lang == "es" and country.name_es:
            return country.name_es
        return country.name

    def get_role_title(self, obj):
        role = obj.role
        if role is None:
            return None
        lang = self._get_lang()
        if lang == "es" and role.title_es:
            return role.title_es
        return role.title

    def get_status_display(self, obj):
        return _lookup_label(obj.status, self._get_lang())

    def _get_lang(self):
        request = self.context.get("request", None)
        return request.query_params.get("lang", "en") if request else "en"

    def get_certifications_list(self, obj):
        return [line.strip() for line in obj.certifications.splitlines() if line.strip()]


class MemberSelfUpdateSerializer(serializers.Serializer):
    """Writable fields a signed-in member may update on their own profile.

    Everything the roster tracks is editable except joined_date, role and
    status (those stay staff-controlled). The login `username` and an optional
    new password live on the linked auth account and are applied alongside.
    """

    username = serializers.CharField(required=False, allow_blank=False)
    full_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    country = serializers.PrimaryKeyRelatedField(queryset=models.Country.objects.all(), required=False, allow_null=True)
    blood_type = LookupKeyField(models.BloodType, required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(required=False, allow_blank=True)
    certifications = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    new_password = serializers.CharField(required=False, allow_blank=False, write_only=True)
    confirm_password = serializers.CharField(required=False, allow_blank=False, write_only=True)

    def validate_username(self, value):
        value = (value or "").strip().lower()
        if not value:
            raise serializers.ValidationError("Username may not be empty.")
        if not re.fullmatch(r"[\w.@+-]+", value):
            raise serializers.ValidationError(
                "Enter a valid username. Letters, digits and @/./+/-/_ only."
            )
        return value

    def validate(self, attrs):
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")
        if new_password and new_password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": "The two passwords do not match."}
            )
        return attrs


class CommandLeadershipSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    """Public card for one command-staff member (imported from the roster)."""

    name = serializers.SerializerMethodField()
    role_title = serializers.SerializerMethodField()
    hierarchy_name = serializers.SerializerMethodField()

    class Meta:
        model = models.Member
        fields = ["id", "name", "role_title", "hierarchy_name", "joined_date", "photo"]

    def get_name(self, obj):
        return obj.full_name

    def get_role_title(self, obj):
        role = obj.role
        if role is None:
            return None
        lang = self._get_lang()
        if lang == "es" and role.title_es:
            return role.title_es
        return role.title

    def get_hierarchy_name(self, obj):
        if obj.role is None or obj.role.hierarchy is None:
            return None
        lang = self._get_lang()
        h = obj.role.hierarchy
        if lang == "es" and h.name_es:
            return h.name_es
        return h.name


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ContactMessage
        fields = [
            "id", "name", "email", "phone", "subject", "message",
            "is_media_inquiry", "submitted_at",
        ]
        read_only_fields = ["submitted_at"]


# ---------------------------------------------------------------------------
# Staff-only serializers used by the frontend admin module.
#
# The public serializers above expose live-translated fields via
# SerializerMethodField getters, which are read-only. For the admin CRUD UI we
# need every raw database field (both EN and the `_es` sibling) to be readable
# and writable, so staff requests are served these plain ModelSerializers.
# ---------------------------------------------------------------------------
class TeamStatusAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TeamStatus
        fields = ["id", "status", "note", "note_es", "updated_at"]
        read_only_fields = ["updated_at"]


class ImpactMetricAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ImpactMetric
        fields = ["id", "label", "label_es", "value", "order"]


class CapabilityAdminSerializer(serializers.ModelSerializer):
    category = LookupKeyField(models.CapabilityCategory, required=False)

    class Meta:
        model = models.Capability
        fields = ["id", "category", "title", "title_es", "summary", "summary_es",
                  "description", "description_es", "order"]


class NewsUpdateAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.NewsUpdate
        fields = ["id", "title", "title_es", "category", "summary", "summary_es",
                  "body", "body_es", "published_at", "is_published"]


class DeploymentAdminSerializer(serializers.ModelSerializer):
    status = LookupKeyField(models.DeploymentStatus, required=False)

    class Meta:
        model = models.Deployment
        fields = ["id", "name", "name_es", "location", "location_es", "status",
                  "start_date", "end_date", "summary", "summary_es", "is_public",
                  "map_area"]


class TrainingExerciseAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TrainingExercise
        fields = ["id", "title", "title_es", "date", "description",
                  "description_es", "partner_agencies"]


class TeamRoleAdminSerializer(serializers.ModelSerializer):
    hierarchy = serializers.PrimaryKeyRelatedField(
        queryset=models.Hierarchy.objects.all(), required=True, allow_null=False
    )
    hierarchy_name = serializers.CharField(source="hierarchy.name", read_only=True)

    class Meta:
        model = models.TeamRole
        fields = ["id", "hierarchy", "hierarchy_name", "title", "title_es",
                  "summary", "summary_es", "requirements", "requirements_es",
                  "time_commitment"]


class HierarchyAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Hierarchy
        fields = ["id", "name", "name_es", "description", "description_es", "order"]


class ApplicantPipelinePhaseAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ApplicantPipelinePhase
        fields = [
            "id", "name", "name_es", "description", "description_es",
            "phase_number", "pipeline_key",
        ]


class AffiliationAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Affiliation
        fields = ["id", "name", "name_es", "url", "logo"]


class PartnerAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Partner
        fields = ["id", "name", "name_es", "partner_type", "url", "logo"]


class FundingNeedAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.FundingNeed
        fields = ["id", "item", "item_es", "description", "description_es",
                  "cost_estimate", "image", "is_fulfilled", "order"]


class SponsorshipTierAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SponsorshipTier
        fields = ["id", "name", "name_es", "annual_amount", "benefits",
                  "benefits_es", "order"]


class CountrySerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    name = serializers.SerializerMethodField()

    class Meta:
        model = models.Country
        fields = ["id", "name", "name_es", "code"]

    get_name = translated_method("name")


class CountryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Country
        fields = ["id", "name", "name_es", "code"]


class LookupAdminSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ["id", "status", "note", "note_es", "updated_at"]
        read_only_fields = ["updated_at"]


class MemberStatusAdminSerializer(LookupAdminSerializer):
    class Meta(LookupAdminSerializer.Meta):
        model = models.MemberStatus


class BloodTypeAdminSerializer(LookupAdminSerializer):
    class Meta(LookupAdminSerializer.Meta):
        model = models.BloodType


class DeploymentStatusAdminSerializer(LookupAdminSerializer):
    class Meta(LookupAdminSerializer.Meta):
        model = models.DeploymentStatus


class CapabilityCategoryAdminSerializer(LookupAdminSerializer):
    class Meta(LookupAdminSerializer.Meta):
        model = models.CapabilityCategory


class MemberStatusSerializer(LookupSerializer):
    class Meta:
        model = models.MemberStatus
        fields = ["id", "status", "label", "note", "note_es"]


class BloodTypeSerializer(LookupSerializer):
    class Meta:
        model = models.BloodType
        fields = ["id", "status", "label", "note", "note_es"]


class DeploymentStatusSerializer(LookupSerializer):
    class Meta:
        model = models.DeploymentStatus
        fields = ["id", "status", "label", "note", "note_es"]


class CapabilityCategorySerializer(LookupSerializer):
    class Meta:
        model = models.CapabilityCategory
        fields = ["id", "status", "label", "note", "note_es"]


ADMIN_SERIALIZER_MAP = {
    models.TeamStatus: TeamStatusAdminSerializer,
    models.ImpactMetric: ImpactMetricAdminSerializer,
    models.Capability: CapabilityAdminSerializer,
    models.NewsUpdate: NewsUpdateAdminSerializer,
    models.Deployment: DeploymentAdminSerializer,
    models.TrainingExercise: TrainingExerciseAdminSerializer,
    models.TeamRole: TeamRoleAdminSerializer,
    models.Hierarchy: HierarchyAdminSerializer,
    models.ApplicantPipelinePhase: ApplicantPipelinePhaseAdminSerializer,
    models.Affiliation: AffiliationAdminSerializer,
    models.Partner: PartnerAdminSerializer,
    models.FundingNeed: FundingNeedAdminSerializer,
    models.SponsorshipTier: SponsorshipTierAdminSerializer,
    models.Country: CountryAdminSerializer,
    models.MemberStatus: MemberStatusAdminSerializer,
    models.BloodType: BloodTypeAdminSerializer,
    models.DeploymentStatus: DeploymentStatusAdminSerializer,
    models.CapabilityCategory: CapabilityCategoryAdminSerializer,
}
