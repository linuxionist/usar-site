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
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Team status"

    def __str__(self):
        return self.get_status_display()


class ImpactMetric(models.Model):
    """Key stats shown on the homepage (years active, lives saved, etc.)."""

    label = models.CharField(max_length=100)
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
    summary = models.CharField(max_length=255)
    description = models.TextField()
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
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="news")
    summary = models.CharField(max_length=300)
    body = models.TextField(blank=True)
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
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    summary = models.TextField()
    is_public = models.BooleanField(
        default=True, help_text="Uncheck to withhold details per safety protocol"
    )

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.name} ({self.location})"


class TrainingExercise(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateField()
    description = models.TextField(blank=True)
    partner_agencies = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.title


class TeamRole(models.Model):
    TRACK_CHOICES = [
        ("rescue_specialist", "Rescue Specialist"),
        ("k9_handler", "K9 Handler"),
        ("medical_officer", "Medical Officer"),
        ("hazmat_specialist", "HazMat Specialist"),
        ("logistics", "Logistics / Support Personnel"),
    ]

    track = models.CharField(max_length=30, choices=TRACK_CHOICES)
    title = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    summary = models.CharField(max_length=255)
    requirements = models.TextField(help_text="One requirement per line")
    time_commitment = models.CharField(max_length=150, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class TrainingPipelineStage(models.Model):
    """Ordered onboarding stages shown on the Join page (a real sequence)."""

    order = models.PositiveIntegerField()
    title = models.CharField(max_length=150)
    description = models.TextField()

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.order}. {self.title}"


class VolunteerApplication(models.Model):
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    role_interest = models.ForeignKey(
        TeamRole, on_delete=models.SET_NULL, null=True, blank=True, related_name="applications"
    )
    message = models.TextField(blank=True)
    resume = models.FileField(upload_to="resumes/", blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.full_name} — {self.role_interest}"


class LeadershipMember(models.Model):
    name = models.CharField(max_length=150)
    role_title = models.CharField(max_length=150)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="leadership/", blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.name} — {self.role_title}"


class Affiliation(models.Model):
    """Governing bodies / standards the team is aligned with (INSARAG, FEMA, etc.)."""

    name = models.CharField(max_length=150)
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
    partner_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    url = models.URLField(blank=True)
    logo = models.ImageField(upload_to="partners/", blank=True, null=True)

    def __str__(self):
        return self.name


class FundingNeed(models.Model):
    """Wishlist items shown on the Donate page."""

    item = models.CharField(max_length=150)
    description = models.TextField(blank=True)
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
    annual_amount = models.DecimalField(max_digits=10, decimal_places=2)
    benefits = models.TextField(help_text="One benefit per line")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class Member(models.Model):
    """An active/probationary team member — the admin module's roster.

    Distinct from LeadershipMember (public-facing command staff bios) and
    VolunteerApplication (a pending application before someone becomes a
    Member).
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
