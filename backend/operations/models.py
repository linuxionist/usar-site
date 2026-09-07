import secrets
import string

from django.conf import settings
from django.db import models


class TeamStatus(models.Model):
    """Singleton-style record driving the homepage status dashboard."""

    READY = "ready"
    TRAINING = "training"
    DEPLOYED = "deployed"
    STATUS_CHOICES = [
        (READY, "Ready for Deployment"),
        (TRAINING, "Training in Progress"),
        (DEPLOYED, "Active Deployment"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=READY)
    note = models.CharField(max_length=255, blank=True)
    note_es = models.CharField(max_length=255, blank=True, verbose_name="Nota (ES)")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Team status"

    def __str__(self):
        return self.get_status_display()


class ImpactMetric(models.Model):
    """Key stats shown on the homepage (years active, lives saved, etc.)."""

    label = models.CharField(max_length=100)
    label_es = models.CharField(max_length=100, blank=True, verbose_name="Etiqueta (ES)")
    value = models.CharField(max_length=50)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.value} {self.label}"


class Capability(models.Model):
    CATEGORY_CHOICES = [
        ("heavy_technical", "Heavy/Technical Rescue"),
        ("k9", "Canine (K9) Unit"),
        ("technical_search", "Technical Search"),
        ("medical", "Medical Task Force"),
        ("hazmat", "Hazardous Materials & Technical Support"),
    ]

    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=150)
    title_es = models.CharField(max_length=150, blank=True, verbose_name="Título (ES)")
    summary = models.CharField(max_length=255)
    summary_es = models.CharField(max_length=255, blank=True, verbose_name="Resumen (ES)")
    description = models.TextField()
    description_es = models.TextField(blank=True, verbose_name="Descripción (ES)")
    icon = models.CharField(
        max_length=50, blank=True, help_text="Icon key used by the frontend, e.g. 'shoring'"
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class NewsUpdate(models.Model):
    CATEGORY_CHOICES = [
        ("news", "Team Update"),
        ("dispatch", "Dispatch Log"),
        ("exercise", "Training Exercise"),
    ]

    title = models.CharField(max_length=200)
    title_es = models.CharField(max_length=200, blank=True, verbose_name="Título (ES)")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="news")
    summary = models.CharField(max_length=300)
    summary_es = models.CharField(max_length=300, blank=True, verbose_name="Resumen (ES)")
    body = models.TextField(blank=True)
    body_es = models.TextField(blank=True, verbose_name="Cuerpo (ES)")
    published_at = models.DateTimeField()
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["-published_at"]

    def __str__(self):
        return self.title


class Deployment(models.Model):
    STATUS_CHOICES = [
        ("active", "Active Operation"),
        ("completed", "Completed"),
    ]

    name = models.CharField(max_length=200)
    name_es = models.CharField(max_length=200, blank=True, verbose_name="Nombre (ES)")
    location = models.CharField(max_length=200)
    location_es = models.CharField(max_length=200, blank=True, verbose_name="Ubicación (ES)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    summary = models.TextField()
    summary_es = models.TextField(blank=True, verbose_name="Resumen (ES)")
    is_public = models.BooleanField(
        default=True, help_text="Uncheck to withhold details per safety protocol"
    )

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.name} ({self.location})"


class TrainingExercise(models.Model):
    title = models.CharField(max_length=200)
    title_es = models.CharField(max_length=200, blank=True, verbose_name="Título (ES)")
    date = models.DateField()
    description = models.TextField(blank=True)
    description_es = models.TextField(blank=True, verbose_name="Descripción (ES)")
    partner_agencies = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.title


class Hierarchy(models.Model):
    """Rank bands for the team: order 1 is the highest rank.

    A hierarchy is a command level (Commander, Deputy Commander, Team Leader,
    Field Specialist, ...); TeamRoles belong to one hierarchy and the order
    value places that band in the chain of command.
    """

    name = models.CharField(max_length=150)
    name_es = models.CharField(max_length=150, blank=True, verbose_name="Nombre (ES)")
    description = models.TextField(blank=True)
    description_es = models.TextField(blank=True, verbose_name="Descripción (ES)")
    order = models.PositiveIntegerField(
        help_text="1 = highest rank; higher numbers = lower rank"
    )

    class Meta:
        ordering = ["order"]
        verbose_name_plural = "Hierarchies"

    def __str__(self):
        return self.name


class TeamRole(models.Model):
    hierarchy = models.ForeignKey(
        "Hierarchy",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="roles",
        help_text="Rank band this role belongs to (1 = highest rank).",
    )
    title = models.CharField(max_length=150)
    title_es = models.CharField(max_length=150, blank=True, verbose_name="Título (ES)")
    summary = models.CharField(max_length=255)
    summary_es = models.CharField(max_length=255, blank=True, verbose_name="Resumen (ES)")
    requirements = models.TextField(help_text="One requirement per line")
    requirements_es = models.TextField(blank=True, help_text="Spanish requirements, one per line", verbose_name="Requisitos (ES)")
    time_commitment = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["hierarchy__order", "id"]

    def __str__(self):
        return self.title


APPLICANT_PIPELINE_KEYS = [
    ("application", "Prerequisite and Application"),
    ("screening", "Screening and Background"),
    ("probation", "Physical and Practical Evaluation"),
    ("board", "Board Review and Final Approval"),
    ("active", "Training or Rejection"),
]


class ApplicantPipelinePhase(models.Model):
    """Editable pipeline phases shown on the Join page and the admin kanban.

    ``pipeline_key`` is the internal key stored on
    ``VolunteerApplication.pipeline_phase`` (a ForeignKey to this table) so each
    column can still filter applicants by the internal phase while displaying
    the editable phase number + name.
    """

    name = models.CharField(max_length=150)
    name_es = models.CharField(max_length=150, blank=True, verbose_name="Nombre (ES)")
    description = models.TextField(blank=True)
    description_es = models.TextField(blank=True, verbose_name="Descripción (ES)")
    phase_number = models.PositiveIntegerField(unique=True)
    pipeline_key = models.CharField(
        max_length=20, choices=APPLICANT_PIPELINE_KEYS, unique=True
    )

    class Meta:
        ordering = ["phase_number"]

    def __str__(self):
        return f"Phase {self.phase_number}: {self.name}"


class VolunteerApplication(models.Model):
    """A volunteer application tracked through the onboarding pipeline."""

    PHASE_APPLICATION = "application"  # Phase 1
    PHASE_SCREENING = "screening"      # Phase 2
    PHASE_PROBATION = "probation"      # Phase 3
    PHASE_BOARD = "board"              # Phase 4
    PHASE_ACTIVE = "active"            # Phase 5 - Active Duty
    PHASE_REJECTED = "rejected"        # Phase 5 - Rejected
    PHASE_CHOICES = [
        (PHASE_APPLICATION, "Phase 1: Application submitted"),
        (PHASE_SCREENING, "Phase 2: Screening & Interview"),
        (PHASE_PROBATION, "Phase 3: Probation & Training"),
        (PHASE_BOARD, "Phase 4: Board Review"),
        (PHASE_ACTIVE, "Active Duty"),
        (PHASE_REJECTED, "Rejected"),
    ]

    # Default mandatory checklist items required for each pipeline phase.
    PHASE_CHECKLIST = {
        PHASE_APPLICATION: [
            "Application form reviewed",
            "Documents collected",
            "Identity verified",
        ],
        PHASE_SCREENING: [
            "Background check done",
            "Interview completed",
        ],
        PHASE_PROBATION: [
            "Physical evaluation passed",
            "Practical evaluation passed",
        ],
        PHASE_BOARD: [
            "Board approval passed",
        ],
    }


    DOC_DOCUMENT = "document"
    DOC_CERTIFICATION = "certification"
    DOC_MEDICAL = "medical"
    DOC_KIND_CHOICES = [
        (DOC_DOCUMENT, "Document"),
        (DOC_CERTIFICATION, "Certification"),
        (DOC_MEDICAL, "Medical"),
    ]

    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    id_number = models.CharField(
        max_length=50, blank=True, verbose_name="National ID number"
    )
    country = models.ForeignKey(
        "Country",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applications",
        verbose_name="Country",
    )
    role_interest = models.ForeignKey(
        TeamRole, on_delete=models.SET_NULL, null=True, blank=True, related_name="applications"
    )
    message = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    application_code = models.CharField(max_length=20, unique=True, blank=True)
    pipeline_phase = models.ForeignKey(
        "ApplicantPipelinePhase",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="applications",
        verbose_name="Pipeline phase",
    )
    is_flagged = models.BooleanField(default=False, help_text="Flagged for review")
    is_rejected = models.BooleanField(default=False)
    reviewed = models.BooleanField(default=False)
    archived = models.BooleanField(default=False, help_text="Archived from the active pipeline")

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.full_name} — {self.role_interest}"

    def generate_code(self):
        alphabet = string.ascii_uppercase + string.digits
        return "USAR-" + "".join(secrets.choice(alphabet) for _ in range(6))

    def save(self, *args, **kwargs):
        if self.pipeline_phase_id is None:
            self.pipeline_phase = ApplicantPipelinePhase.objects.filter(
                pipeline_key=self.PHASE_APPLICATION
            ).first()
        if not self.application_code:
            code = self.generate_code()
            while VolunteerApplication.objects.filter(application_code=code).exists():
                code = self.generate_code()
            self.application_code = code
        super().save(*args, **kwargs)


class ApplicationDocument(models.Model):
    """A certification or medical PDF attached to an application."""

    application = models.ForeignKey(
        VolunteerApplication, on_delete=models.CASCADE, related_name="documents"
    )
    kind = models.CharField(max_length=20, choices=VolunteerApplication.DOC_KIND_CHOICES)
    file = models.FileField(upload_to="applications/documents/")
    approved = models.BooleanField(null=True, blank=True, help_text="None = not yet reviewed")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_kind_display()} — {self.application.full_name}"


class MedicalDocument(models.Model):
    """Medical documents attached by the applicant after Phase 2 approval."""

    application = models.ForeignKey(
        VolunteerApplication, on_delete=models.CASCADE, related_name="medical_documents"
    )
    file = models.FileField(upload_to="applications/medical/")
    approved = models.BooleanField(null=True, blank=True, help_text="None = not yet reviewed")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Medical — {self.application.full_name}"


class ApplicationPhaseComment(models.Model):
    """One editable message per phase shown to the applicant where appropriate."""

    application = models.ForeignKey(
        VolunteerApplication, on_delete=models.CASCADE, related_name="comments"
    )
    phase = models.CharField(max_length=20, choices=VolunteerApplication.PHASE_CHOICES)
    text = models.TextField(blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("application", "phase")]

    def __str__(self):
        return f"Comment for {self.get_phase_display()}"


class ChecklistDefinition(models.Model):
    """Catalog of mandatory checklist items per pipeline phase.

    Stored once (like Country) so the phase + label texts are not repeated on
    every application; each application's checklist row only holds a reference.
    """

    phase = models.CharField(max_length=20, choices=VolunteerApplication.PHASE_CHOICES)
    label = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["phase", "order"]
        constraints = [
            models.UniqueConstraint(fields=["phase", "label"], name="uniq_checklist_def_phase_label")
        ]

    def __str__(self):
        return f"[{self.get_phase_display()}] {self.label}"


class ApplicationChecklistItem(models.Model):
    """A mandatory item for a phase; the phase can't be advanced until all are done."""

    application = models.ForeignKey(
        VolunteerApplication, on_delete=models.CASCADE, related_name="checklist"
    )
    definition = models.ForeignKey(
        ChecklistDefinition, on_delete=models.PROTECT, related_name="items"
    )
    done = models.BooleanField(default=False)
    done_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    done_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["application", "definition"], name="uniq_app_checklist_definition"
            )
        ]

    def __str__(self):
        return f"[{self.phase}] {self.label}"

    @property
    def phase(self):
        return self.definition.phase

    @property
    def label(self):
        return self.definition.label

    def get_phase_display(self):
        return self.definition.get_phase_display()


def ensure_checklist_items(application, phase):
    """Create the default checklist rows for a phase from the catalog if absent."""
    labels = VolunteerApplication.PHASE_CHECKLIST.get(phase, [])
    for order, label in enumerate(labels):
        definition, _ = ChecklistDefinition.objects.get_or_create(
            phase=phase, label=label, defaults={"order": order}
        )
        ApplicationChecklistItem.objects.get_or_create(
            application=application, definition=definition
        )
    return ApplicationChecklistItem.objects.filter(
        application=application, definition__phase=phase
    ).count()


class ApplicationLog(models.Model):
    """Uneditable audit entry generated on every status change."""

    application = models.ForeignKey(
        VolunteerApplication, on_delete=models.CASCADE, related_name="logs"
    )
    entry = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} — {self.entry}"


class Affiliation(models.Model):
    """Governing bodies / standards the team is aligned with (INSARAG, FEMA, etc.)."""

    name = models.CharField(max_length=150)
    name_es = models.CharField(max_length=150, blank=True, verbose_name="Nombre (ES)")
    url = models.URLField(blank=True)
    logo = models.ImageField(upload_to="affiliations/", blank=True, null=True)

    def __str__(self):
        return self.name


class Partner(models.Model):
    TYPE_CHOICES = [
        ("agency", "Sponsoring Agency"),
        ("fire_department", "Fire Department"),
        ("ngo", "NGO / Nonprofit Partner"),
    ]

    name = models.CharField(max_length=150)
    name_es = models.CharField(max_length=150, blank=True, verbose_name="Nombre (ES)")
    partner_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    url = models.URLField(blank=True)
    logo = models.ImageField(upload_to="partners/", blank=True, null=True)

    def __str__(self):
        return self.name


class FundingNeed(models.Model):
    """Wishlist items shown on the Donate page."""

    item = models.CharField(max_length=150)
    item_es = models.CharField(max_length=150, blank=True, verbose_name="Artículo (ES)")
    description = models.TextField(blank=True)
    description_es = models.TextField(blank=True, verbose_name="Descripción (ES)")
    cost_estimate = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="funding/", blank=True, null=True)
    is_fulfilled = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.item


class SponsorshipTier(models.Model):
    name = models.CharField(max_length=100)
    name_es = models.CharField(max_length=100, blank=True, verbose_name="Nombre (ES)")
    annual_amount = models.DecimalField(max_digits=10, decimal_places=2)
    benefits = models.TextField(help_text="One benefit per line")
    benefits_es = models.TextField(blank=True, help_text="Spanish benefits, one per line", verbose_name="Beneficios (ES)")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class Member(models.Model):
    """An active/probationary team member — the admin module's roster.

    Members with a role whose Hierarchy has ``order`` 1 or 2 are the team's
    command staff and are shown on the public Command & Leadership section.
    """

    ACTIVE = "active"
    PROBATION = "probation"
    LEAVE = "leave"
    INACTIVE = "inactive"
    STATUS_CHOICES = [
        (ACTIVE, "Active"),
        (PROBATION, "Probationary"),
        (LEAVE, "On Leave"),
        (INACTIVE, "Inactive"),
    ]

    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    id_number = models.CharField(max_length=50, blank=True, verbose_name="National ID number")
    country = models.ForeignKey(
        "Country",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
        verbose_name="Country",
    )
    blood_type = models.CharField(max_length=10, blank=True, verbose_name="Blood type")
    role = models.ForeignKey(
        TeamRole, on_delete=models.SET_NULL, null=True, blank=True, related_name="members"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PROBATION)
    joined_date = models.DateField()
    certifications = models.TextField(blank=True, help_text="One certification per line")
    photo = models.ImageField(upload_to="members/", blank=True, null=True)
    notes = models.TextField(blank=True, help_text="Internal notes, not shown publicly")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.get_status_display()})"


class ContactMessage(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    is_media_inquiry = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.name} — {self.subject or 'General inquiry'}"


class Country(models.Model):
    name = models.CharField(max_length=150)
    name_es = models.CharField(max_length=150, blank=True, verbose_name="Nombre (ES)")
    code = models.CharField(max_length=2, unique=True, help_text="ISO 3166-1 alpha-2")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
