import os
import secrets

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import viewsets, mixins, filters, permissions, status
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db import transaction
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db.models import Case, When, Value, CharField as DjangoCharField
from django.shortcuts import get_object_or_404
from django.utils import timezone
from . import models, serializers

User = get_user_model()


class IsStaffOrReadOnly(permissions.BasePermission):
    """Public can read (safe methods); only authenticated staff may write.

    Used by content viewsets so the public site keeps read access while the
    staff-only admin module can create/edit/delete via the API.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class StaffContentViewSet(viewsets.ModelViewSet):
    """Base for content models: everyone may read, only staff may write."""

    permission_classes = [IsStaffOrReadOnly]

    def get_serializer_class(self):
        # Staff use the raw bilingual admin serializers (read + write); the
        # public keeps the live-translated, read-only serializers.
        if self.request.user and self.request.user.is_staff:
            model = getattr(self.serializer_class.Meta, "model", None)
            if model is not None:
                admin = serializers.ADMIN_SERIALIZER_MAP.get(model)
                if admin is not None:
                    return admin
        return super().get_serializer_class()


class TeamStatusViewSet(StaffContentViewSet):
    """Exposes the homepage dashboard status; staff manage the single record."""

    serializer_class = serializers.TeamStatusSerializer

    def get_queryset(self):
        # There should only ever be one row; the public dashboard reads the most recent.
        return models.TeamStatus.objects.all()


class ImpactMetricViewSet(StaffContentViewSet):
    queryset = models.ImpactMetric.objects.all()
    serializer_class = serializers.ImpactMetricSerializer


class CapabilityViewSet(StaffContentViewSet):
    queryset = models.Capability.objects.all()
    serializer_class = serializers.CapabilitySerializer
    filterset_fields = ["category__status"]

    def get_queryset(self):
        # Filtering by ?category=<key> maps onto the FK's lookup key.
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__status=category)
        return qs


class NewsUpdateViewSet(StaffContentViewSet):
    serializer_class = serializers.NewsUpdateSerializer
    filterset_fields = ["category"]

    def get_queryset(self):
        # Staff manage all posts (including unpublished); the public sees published only.
        if self.request.user and self.request.user.is_staff:
            return models.NewsUpdate.objects.all()
        return models.NewsUpdate.objects.filter(
            is_published=True, published_at__lte=timezone.now()
        )


class DeploymentViewSet(StaffContentViewSet):
    serializer_class = serializers.DeploymentSerializer

    def get_queryset(self):
        # Staff manage all records; the public sees public deployments only.
        if self.request.user and self.request.user.is_staff:
            qs = models.Deployment.objects.all()
        else:
            qs = models.Deployment.objects.filter(is_public=True)
        status_key = self.request.query_params.get("status")
        if status_key:
            qs = qs.filter(status__status=status_key)
        return qs


class TrainingExerciseViewSet(StaffContentViewSet):
    queryset = models.TrainingExercise.objects.all()
    serializer_class = serializers.TrainingExerciseSerializer


class TeamRolePagination(PageNumberPagination):
    """10-per-page pagination for the team roles table (mirrors the applicant
    archive module so both staff tables paginate identically)."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class TeamRoleViewSet(StaffContentViewSet):
    queryset = models.TeamRole.objects.all()
    serializer_class = serializers.TeamRoleSerializer
    pagination_class = TeamRolePagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ["hierarchy"]
    search_fields = [
        "title",
        "title_es",
        "summary",
        "summary_es",
        "requirements",
        "requirements_es",
        "hierarchy__name",
        "hierarchy__name_es",
    ]
    ordering_fields = [
        "title",
        "title_es",
        "hierarchy__name",
        "hierarchy__order",
        "time_commitment",
    ]


class HierarchyViewSet(StaffContentViewSet):
    queryset = models.Hierarchy.objects.all()
    serializer_class = serializers.HierarchySerializer


class ApplicantPipelinePhaseViewSet(StaffContentViewSet):
    queryset = models.ApplicantPipelinePhase.objects.all()
    serializer_class = serializers.ApplicantPipelinePhaseSerializer


class VolunteerApplicationPermission(permissions.BasePermission):
    """Anyone may submit an application (POST); only staff may read/manage them."""

    def has_permission(self, request, view):
        if request.method == "POST":
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class VolunteerApplicationPagination(PageNumberPagination):
    """10-per-page pagination for the applicant archive module.

    The kanban view requests page_size=100 so it can render every applicant in
    one request, so the cap allows that while the archive table (no page_size
    parameter) still gets the default 10 rows.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class VolunteerApplicationViewSet(viewsets.ModelViewSet):
    """Public submissions create records; staff manage the onboarding pipeline."""

    queryset = models.VolunteerApplication.objects.all()
    serializer_class = serializers.VolunteerApplicationSerializer
    permission_classes = [VolunteerApplicationPermission]
    pagination_class = VolunteerApplicationPagination
    filterset_fields = ["reviewed", "role_interest", "pipeline_phase"]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = [
        "full_name",
        "email",
        "application_code",
        "id_number",
        "phone",
        "country__name",
    ]
    ordering_fields = [
        "submitted_at",
        "full_name",
        "email",
        "role_interest__title",
        "status",
    ]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user and self.request.user.is_staff:
            qs = qs.select_related("country", "role_interest", "pipeline_phase").prefetch_related(
                "documents", "medical_documents", "comments", "checklist", "logs"
            )
            qs = qs.annotate(
                status=Case(
                    When(is_rejected=True, then=Value("rejected")),
                    When(pipeline_phase__pipeline_key=models.VolunteerApplication.PHASE_REJECTED, then=Value("rejected")),
                    When(pipeline_phase__pipeline_key=models.VolunteerApplication.PHASE_ACTIVE, then=Value("active")),
                    default=Value("in_progress"),
                    output_field=DjangoCharField(),
                )
            )
            return qs
        return qs.none()

    def get_serializer_class(self):
        if self.request.user and self.request.user.is_staff:
            return serializers.VolunteerApplicationAdminSerializer
        return super().get_serializer_class()

    def _log(self, app, entry):
        models.ApplicationLog.objects.create(
            application=app, entry=entry, created_by=self.request.user
        )

    def _approver_label(self):
        user = self.request.user
        label = user.username if user else "Staff"
        return label

    def _serialized(self, app):
        """Return a freshly-serialized application so nested documents/checklist
        reflect the just-applied action (avoids stale prefetched relations)."""
        fresh = models.VolunteerApplication.objects.select_related(
            "country", "pipeline_phase"
        ).prefetch_related(
            "documents", "medical_documents", "comments", "checklist", "logs"
        ).get(pk=app.pk)
        return serializers.VolunteerApplicationAdminSerializer(fresh).data

    @action(detail=True, methods=["post"])
    def set_checklist(self, request, pk=None):
        app = self.get_object()
        item_id = request.data.get("item_id")
        done = bool(request.data.get("done"))
        item = get_object_or_404(app.checklist, id=item_id)
        if item.done != done:
            item.done = done
            item.done_by = request.user if done else None
            item.done_at = timezone.now() if done else None
            item.save()
            self._log(
                app,
                f"{item.label} {'completed' if done else 'uncompleted'} by {self._approver_label()}",
            )
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def set_comment(self, request, pk=None):
        app = self.get_object()
        phase = request.data.get("phase")
        text = request.data.get("text", "")
        if phase not in dict(models.VolunteerApplication.PHASE_CHOICES):
            return Response({"detail": "Invalid phase."}, status=status.HTTP_400_BAD_REQUEST)
        comment, _ = models.ApplicationPhaseComment.objects.update_or_create(
            application=app, phase=phase, defaults={"text": text, "updated_by": request.user}
        )
        self._log(app, f"Comment for {phase} updated by {self._approver_label()}")
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def approve_document(self, request, pk=None):
        app = self.get_object()
        doc_id = request.data.get("document_id")
        doc = get_object_or_404(app.documents, id=doc_id)
        doc.approved = True
        doc.save()
        self._log(app, f"Document {doc.file.name.split('/')[-1]} approved by {self._approver_label()}")
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def reject_document(self, request, pk=None):
        app = self.get_object()
        doc_id = request.data.get("document_id")
        doc = get_object_or_404(app.documents, id=doc_id)
        doc.approved = False
        doc.save()
        self._log(app, f"Document {doc.file.name.split('/')[-1]} rejected by {self._approver_label()}")
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def approve_medical(self, request, pk=None):
        app = self.get_object()
        doc_id = request.data.get("document_id")
        doc = get_object_or_404(app.medical_documents, id=doc_id)
        doc.approved = True
        doc.save()
        self._log(app, f"Medical document approved by {self._approver_label()}")
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def reject_medical(self, request, pk=None):
        app = self.get_object()
        doc_id = request.data.get("document_id")
        doc = get_object_or_404(app.medical_documents, id=doc_id)
        doc.approved = False
        doc.save()
        self._log(app, f"Medical document rejected by {self._approver_label()}")
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def advance_phase(self, request, pk=None):
        app = self.get_object()
        current = app.pipeline_phase.pipeline_key if app.pipeline_phase else None
        if current in ("active", "rejected"):
            return Response({"detail": "Application already closed."}, status=status.HTTP_400_BAD_REQUEST)
        pending = app.checklist.filter(definition__phase=current, done=False).exists()
        if pending:
            return Response(
                {"detail": "Complete all mandatory checklist items for this phase before advancing."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order = ["application", "screening", "probation", "board"]
        if current not in order:
            return Response({"detail": "Cannot advance from this phase."}, status=status.HTTP_400_BAD_REQUEST)
        next_phase = order[order.index(current) + 1]
        app.pipeline_phase = models.ApplicantPipelinePhase.objects.get(pipeline_key=next_phase)
        app.save()
        ensure_phase_checklist(app, next_phase)
        self._log(
            app,
            f"{current} approved and advanced to {next_phase} by {self._approver_label()}",
        )
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        app = self.get_object()
        app.pipeline_phase = models.ApplicantPipelinePhase.objects.get(
            pipeline_key=models.VolunteerApplication.PHASE_ACTIVE
        )
        app.reviewed = True
        app.is_rejected = False
        member, _ = models.Member.objects.update_or_create(
            email=app.email,
            defaults={
                "full_name": app.full_name,
                "phone": app.phone,
                "id_number": app.id_number,
                "country": app.country,
                "role": app.role_interest,
                "status": models.MemberStatus.objects.filter(status="active").first(),
                "joined_date": timezone.localdate(),
                "user": self._create_member_user(app),
            },
        )
        app.save()
        self._log(app, f"Approved for Active Duty by {self._approver_label()}")
        return Response(self._serialized(app))

    def _create_member_user(self, app):
        """Create (or fetch) the login account for an activated applicant.

        Username = the applicant's email address; initial password = the
        national ID number they supplied on the form. Re-activating an already
        approved application reuses the existing account so credentials don't
        silently change.
        """
        username = (app.email or "").strip().lower()
        if not username:
            username = f"member{secrets.token_hex(4)}".upper()
        password = app.id_number or ""
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": app.email, "first_name": app.full_name or ""},
        )
        if password:
            validate_password(password, user)
            user.set_password(password)
            user.save(update_fields=["password"])
        return user

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        app = self.get_object()
        app.archived = True
        app.save()
        self._log(app, f"Application archived by {self._approver_label()}")
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        app = self.get_object()
        app.pipeline_phase = models.ApplicantPipelinePhase.objects.get(
            pipeline_key=models.VolunteerApplication.PHASE_ACTIVE
        )
        app.is_rejected = True
        app.reviewed = True
        app.save()
        self._log(app, f"Application rejected by {self._approver_label()}")
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def flag_review(self, request, pk=None):
        app = self.get_object()
        app.is_flagged = not app.is_flagged
        app.save()
        self._log(app, f"{'Flagged' if app.is_flagged else 'Unflagged'} for review by {self._approver_label()}")
        return Response(self._serialized(app))

    @action(detail=True, methods=["post"])
    def request_resubmit(self, request, pk=None):
        app = self.get_object()
        self._log(app, f"Document resubmission requested by {self._approver_label()}")
        return Response(self._serialized(app))


class ApplicantPortalViewSet(viewsets.GenericViewSet):
    """Anonymous endpoints for the public applicant status portal."""

    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"])
    def lookup(self, request):
        email = request.data.get("email", "").strip().lower()
        code = request.data.get("code", "").strip().upper()
        app = models.VolunteerApplication.objects.filter(
            email__iexact=email, application_code__iexact=code
        ).first()
        if app is None:
            return Response(
                {"detail": "No application found for those details."}, status=status.HTTP_404_NOT_FOUND
            )

        phase_key = app.pipeline_phase.pipeline_key if app.pipeline_phase else None
        comment = app.comments.filter(phase=phase_key).first()
        visible = comment.text if comment else ""
        # The board-review comment is only shown once the review is finalised.
        # Phase 5 (active / rejected) comments are shown like every other phase.
        if phase_key == "board" and (app.reviewed or app.is_rejected):
            visible = ""

        can_medical = _can_submit_medical(app)
        data = serializers.ApplicantPortalSerializer(app).data
        data["visible_comment"] = visible
        data["can_submit_medical"] = can_medical
        data["phase_sequence"] = _phase_sequence(phase_key)
        return Response(data)

    @action(detail=False, methods=["post"])
    def upload_documents(self, request):
        email = request.data.get("email", "").strip().lower()
        code = request.data.get("code", "").strip().upper()
        kind = request.data.get("kind", "certification")
        files = request.FILES.getlist("files")
        app = models.VolunteerApplication.objects.filter(
            email__iexact=email, application_code__iexact=code
        ).first()
        if app is None:
            return Response(
                {"detail": "No application found for those details."}, status=status.HTTP_404_NOT_FOUND
            )
        if kind == "medical" and not _can_submit_medical(app):
            return Response(
                {"detail": "Medical documents are not available at this stage."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        created = []
        if kind == "medical":
            id_number = app.id_number or "APP"
            counter = app.medical_documents.count()
            for f in files:
                counter += 1
                ext = os.path.splitext(f.name)[1] or ".pdf"
                renamed = SimpleUploadedFile(
                    f"MED-{id_number}-{counter:03d}{ext}",
                    f.read(),
                    content_type=f.content_type or "application/octet-stream",
                )
                created.append(models.MedicalDocument.objects.create(application=app, file=renamed))
        else:
            for f in files:
                created.append(
                    models.ApplicationDocument.objects.create(
                        application=app, kind=models.VolunteerApplication.DOC_CERTIFICATION, file=f
                    )
                )
        return Response(
            {
                "uploaded": len(created),
                "document_count": app.documents.count() + app.medical_documents.count(),
            },
            status=status.HTTP_201_CREATED,
        )


def _can_submit_medical(app):
    key = app.pipeline_phase.pipeline_key if app.pipeline_phase else None
    return key == "probation" and not app.is_rejected


def ensure_phase_checklist(app, phase):
    """Create the default mandatory checklist items for a phase if absent."""
    return models.ensure_checklist_items(app, phase)


def _phase_sequence(current):
    phase_rows = list(
        models.ApplicantPipelinePhase.objects.all().order_by("phase_number")
    )
    order = [p.pipeline_key for p in phase_rows]
    idx = order.index(current) if current in order else -1
    seq = []
    for i, p in enumerate(phase_rows):
        if idx < 0:
            state = "locked"
        elif idx > i:
            state = "completed"
        elif i == idx:
            state = "active"
        else:
            state = "locked"
        seq.append({"phase": p.pipeline_key, "name": f"Phase {p.phase_number}: {p.name}", "state": state})
    return seq


class AffiliationViewSet(StaffContentViewSet):
    queryset = models.Affiliation.objects.all()
    serializer_class = serializers.AffiliationSerializer


class PartnerViewSet(StaffContentViewSet):
    queryset = models.Partner.objects.all()
    serializer_class = serializers.PartnerSerializer
    filterset_fields = ["partner_type"]


class FundingNeedViewSet(StaffContentViewSet):
    queryset = models.FundingNeed.objects.all()
    serializer_class = serializers.FundingNeedSerializer


class SponsorshipTierViewSet(StaffContentViewSet):
    queryset = models.SponsorshipTier.objects.all()
    serializer_class = serializers.SponsorshipTierSerializer


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Write-only endpoint for the Contact page's general-inquiry form."""

    queryset = models.ContactMessage.objects.all()
    serializer_class = serializers.ContactMessageSerializer


class CountryViewSet(StaffContentViewSet):
    queryset = models.Country.objects.all()
    serializer_class = serializers.CountrySerializer
    search_fields = ["name", "name_es", "code"]
    pagination_class = None


class LookupViewSet(StaffContentViewSet):
    """Base viewset for the small bilingual lookup tables."""

    pagination_class = None


class MemberStatusViewSet(LookupViewSet):
    queryset = models.MemberStatus.objects.all()
    serializer_class = serializers.MemberStatusSerializer


class BloodTypeViewSet(LookupViewSet):
    queryset = models.BloodType.objects.all()
    serializer_class = serializers.BloodTypeSerializer


class DeploymentStatusViewSet(LookupViewSet):
    queryset = models.DeploymentStatus.objects.all()
    serializer_class = serializers.DeploymentStatusSerializer


class CapabilityCategoryViewSet(LookupViewSet):
    queryset = models.CapabilityCategory.objects.all()
    serializer_class = serializers.CapabilityCategorySerializer


class MemberViewSet(viewsets.ModelViewSet):
    """Full CRUD roster of team members — staff-only, powers the admin module."""

    queryset = models.Member.objects.all()
    serializer_class = serializers.MemberSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ["status__status", "role", "blood_type__status"]
    search_fields = ["full_name", "email", "id_number", "country__name", "certifications"]
    ordering_fields = ["full_name", "joined_date", "status__status"]

    def get_queryset(self):
        qs = models.Member.objects.all().select_related("status", "blood_type", "role", "country")
        status_key = self.request.query_params.get("status")
        blood_key = self.request.query_params.get("blood_type")
        if status_key:
            qs = qs.filter(status__status=status_key)
        if blood_key:
            qs = qs.filter(blood_type__status=blood_key)
        return qs

    @action(detail=True, methods=["post"])
    def set_password(self, request, pk=None):
        """Set/change the password of the member's portal login account.

        If the member has no account yet, one is created on the fly (username
        derived from their email address) so their portal access is immediately
        usable. Existing tokens are revoked so the old password stops working
        at once.
        """
        member = self.get_object()
        serializer = serializers.MemberPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_password = serializer.validated_data["new_password"]

        with transaction.atomic():
            if member.user_id is None:
                user, created = self._ensure_member_login(member)
            else:
                user = member.user
                created = False
            try:
                validate_password(new_password, user)
            except Exception as exc:
                messages = getattr(exc, "messages", None) or [str(exc)]
                raise DRFValidationError({"new_password": messages}) from exc
            user.set_password(new_password)
            user.save(update_fields=["password"])
            # Revoke the member's existing sessions so the new password takes effect.
            Token.objects.filter(user=user).delete()
        return Response({"username": user.username, "created": created})

    @staticmethod
    def _ensure_member_login(member):
        base = (member.email or "").strip().lower()
        username = base or f"member{secrets.token_hex(4)}".upper()
        user, _ = User.objects.get_or_create(username=username, defaults={"email": member.email or ""})
        member.user = user
        member.save(update_fields=["user"])
        return user, False


class CommandLeadershipViewSet(viewsets.ReadOnlyModelViewSet):
    """Public Command & Leadership roster.

    Shows team members whose role belongs to a Hierarchy with order 1 or 2
    (the top of the chain of command), sorted by hierarchy rank then name.
    """

    serializer_class = serializers.CommandLeadershipSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            models.Member.objects.filter(role__hierarchy__order__lte=2)
            .select_related("role", "role__hierarchy")
            .order_by("role__hierarchy__order", "full_name")
        )


class AdminLoginView(ObtainAuthToken):
    """POST {username, password} -> {token, username, is_staff}.

    Only staff accounts should be used to sign in to the admin module;
    non-staff credentials authenticate but will be rejected by
    IsAdminUser on every subsequent admin request.
    """

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "username": user.username, "is_staff": user.is_staff}
        )


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {"username": request.user.username, "is_staff": request.user.is_staff}
        )


class MemberPortalViewSet(viewsets.GenericViewSet):
    """Self-service portal for activated team members.

    Members sign in with their email address (username) and national ID
    number (initial password) — both captured when the applicant was approved.
    A new auth token is issued on every login; staff admins may finish here too,
    but the public member flow deliberately stays separate from the admin auth.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = serializers.MemberPortalSerializer

    def get_serializer_context(self):
        return {"request": self.request}

    @action(detail=False, methods=["post"])
    def login(self, request):
        serializer = AuthTokenSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
            }
        )

    @action(detail=False, methods=["get"])
    def profile(self, request):
        if not (request.user and request.user.is_authenticated):
            return Response({"detail": "Authentication credentials were not provided."}, status=401)
        member = models.Member.objects.filter(user=request.user).select_related(
            "status", "blood_type", "role", "country", "user"
        ).first()
        if member is None:
            return Response(
                {"detail": "No member profile is linked to this account."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(self.get_serializer(member).data)

    @action(detail=False, methods=["post", "patch"])
    def update_profile(self, request):
        """Let a member edit their own profile.

        The member may change their login username, set a new password, and
        update every roster field except joined_date, role and status (those
        remain staff-controlled). A password change revokes the old tokens and
        issues a fresh one (returned as ``new_token``) so the session survives.
        """
        if not (request.user and request.user.is_authenticated):
            return Response({"detail": "Authentication credentials were not provided."}, status=401)
        member = models.Member.objects.filter(user=request.user).first()
        if member is None:
            return Response(
                {"detail": "No member profile is linked to this account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = serializers.MemberSelfUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            username = data.get("username")
            if username:
                collision = (
                    User.objects.filter(username__iexact=username)
                    .exclude(pk=request.user.pk)
                    .exists()
                )
                if collision:
                    return Response(
                        {"username": "That username is already in use."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if request.user.username.lower() != username:
                    request.user.username = username
                    request.user.save(update_fields=["username"])

            for field in ("full_name", "phone", "id_number", "certifications", "notes"):
                if field in data:
                    setattr(member, field, data[field])

            if "email" in data:
                email = (data["email"] or "").strip().lower()
                member.email = email
                request.user.email = email
                request.user.save(update_fields=["email"])

            if "country" in data:
                member.country = data["country"]
            if "blood_type" in data:
                member.blood_type = data["blood_type"]

            new_token = None
            new_password = data.get("new_password")
            if new_password:
                try:
                    validate_password(new_password, request.user)
                except Exception as exc:
                    messages = getattr(exc, "messages", None) or [str(exc)]
                    raise DRFValidationError({"new_password": messages}) from exc
                request.user.set_password(new_password)
                request.user.save(update_fields=["password"])
                Token.objects.filter(user=request.user).delete()
                new_token, _ = Token.objects.get_or_create(user=request.user)

            member.save()

        payload = self.get_serializer(member).data
        if new_token:
            payload["new_token"] = new_token.key
        return Response(payload)
