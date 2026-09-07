import os
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
    "Capability.category": {
        "heavy_technical": "Rescate Pesado/Técnico",
        "k9": "Unidad Canina (K9)",
        "technical_search": "Búsqueda Técnica",
        "medical": "Grupo Médico de Tarea",
        "hazmat": "Materiales Peligrosos y Soporte Técnico",
    },
    "NewsUpdate.category": {
        "news": "Actualización del Equipo",
        "dispatch": "Registro de Despacho",
        "exercise": "Ejercicio de Capacitación",
    },
    "Deployment.status": {
        "active": "Operación Activa",
        "completed": "Completado",
    },
    "Partner.partner_type": {
        "agency": "Agencia Patrocinadora",
        "fire_department": "Departamento de Bomberos",
        "ngo": "ONG / Socio Sin Fines de Lucro",
    },
}


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

    class Meta:
        model = models.Capability
        fields = [
            "id", "category", "category_display", "title", "title_es", "summary",
            "summary_es", "description", "description_es", "icon", "order",
        ]

    get_title = translated_method("title")
    get_summary = translated_method("summary")
    get_description = translated_method("description")

    def get_category_display(self, obj):
        return self._get_choice_display(obj, "category", models.Capability.CATEGORY_CHOICES)


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

    class Meta:
        model = models.Deployment
        fields = [
            "id", "name", "name_es", "location", "location_es", "status", "status_display",
            "start_date", "end_date", "summary", "summary_es", "is_public",
        ]

    get_name = translated_method("name")
    get_location = translated_method("location")
    get_summary = translated_method("summary")

    def get_status_display(self, obj):
        return self._get_choice_display(obj, "status", models.Deployment.STATUS_CHOICES)


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
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    role_title = serializers.CharField(source="role.title", read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True, default=None)
    certifications_list = serializers.SerializerMethodField()

    class Meta:
        model = models.Member
        fields = [
            "id", "full_name", "email", "phone", "role", "role_title",
            "id_number", "country", "country_name", "blood_type",
            "status", "status_display", "joined_date", "certifications",
            "certifications_list", "photo", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_certifications_list(self, obj):
        return [line.strip() for line in obj.certifications.splitlines() if line.strip()]


class CommandLeadershipSerializer(serializers.ModelSerializer, TranslatedFieldsMixin):
    """Public card for one command-staff member (imported from the roster)."""

    name = serializers.SerializerMethodField()
    role_title = serializers.SerializerMethodField()
    hierarchy_name = serializers.SerializerMethodField()

    class Meta:
        model = models.Member
        fields = ["id", "name", "role_title", "hierarchy_name", "joined_date"]

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
    class Meta:
        model = models.Capability
        fields = ["id", "category", "title", "title_es", "summary", "summary_es",
                  "description", "description_es", "icon", "order"]


class NewsUpdateAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.NewsUpdate
        fields = ["id", "title", "title_es", "category", "summary", "summary_es",
                  "body", "body_es", "published_at", "is_published"]


class DeploymentAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Deployment
        fields = ["id", "name", "name_es", "location", "location_es", "status",
                  "start_date", "end_date", "summary", "summary_es", "is_public"]


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
}
