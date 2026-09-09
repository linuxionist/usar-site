from django.contrib import admin
from . import models

admin.site.site_header = "USAR Team Administration"
admin.site.site_title = "USAR Admin"
admin.site.index_title = "Content Management"


@admin.register(models.TeamStatus)
class TeamStatusAdmin(admin.ModelAdmin):
    list_display = ["status", "note", "updated_at"]
    fieldsets = (
        ("English", {"fields": (("status", "updated_at"), "note")}),
        ("Spanish", {"fields": ("note_es",)}),
    )
    readonly_fields = ["updated_at"]


@admin.register(models.ImpactMetric)
class ImpactMetricAdmin(admin.ModelAdmin):
    list_display = ["label", "value", "order"]
    list_display_links = ["label"]
    list_editable = ["order"]
    search_fields = ["label", "label_es"]
    fieldsets = (
        ("English", {"fields": (("label", "value"), "order")}),
        ("Spanish", {"fields": ("label_es",)}),
    )


@admin.register(models.Capability)
class CapabilityAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "order"]
    list_filter = ["category"]
    list_editable = ["order"]
    search_fields = ["title", "title_es", "summary", "summary_es"]
    fieldsets = (
        ("English", {"fields": (("category", "order"), "title", "summary", "description")}),
        ("Spanish", {"fields": ("title_es", "summary_es", "description_es")}),
    )


@admin.register(models.NewsUpdate)
class NewsUpdateAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "published_at", "is_published"]
    list_filter = ["category", "is_published"]
    search_fields = ["title", "title_es", "summary", "summary_es"]
    date_hierarchy = "published_at"
    fieldsets = (
        ("English", {"fields": (("category", "is_published"), "title", "summary", "body", "published_at")}),
        ("Spanish", {"fields": ("title_es", "summary_es", "body_es")}),
    )


@admin.register(models.Deployment)
class DeploymentAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "status", "start_date", "is_public"]
    list_filter = ["status", "is_public"]
    search_fields = ["name", "name_es", "location", "location_es"]
    fieldsets = (
        ("English", {"fields": ("name", "location", "status", ("start_date", "end_date"), "summary", "is_public")}),
        ("Map Area (GeoJSON)", {"fields": ("map_area",)}),
        ("Spanish", {"fields": ("name_es", "location_es", "summary_es")}),
    )


@admin.register(models.TrainingExercise)
class TrainingExerciseAdmin(admin.ModelAdmin):
    list_display = ["title", "date"]
    search_fields = ["title", "title_es"]
    fieldsets = (
        ("English", {"fields": ("title", "date", "description", "partner_agencies")}),
        ("Spanish", {"fields": ("title_es", "description_es")}),
    )


@admin.register(models.Hierarchy)
class HierarchyAdmin(admin.ModelAdmin):
    list_display = ["name", "order"]
    list_display_links = ["name"]
    list_editable = ["order"]
    search_fields = ["name", "name_es", "description"]
    fieldsets = (
        ("English", {"fields": (("name", "order"), "description")}),
        ("Spanish", {"fields": ("name_es", "description_es")}),
    )


@admin.register(models.ApplicantPipelinePhase)
class ApplicantPipelinePhaseAdmin(admin.ModelAdmin):
    list_display = ["phase_number", "name", "pipeline_key"]
    list_display_links = ["name"]
    list_editable = ["phase_number"]
    search_fields = ["name", "name_es", "description", "pipeline_key"]
    fieldsets = (
        ("Phase", {"fields": ("phase_number", "pipeline_key")}),
        ("English", {"fields": ("name", "description")}),
        ("Spanish", {"fields": ("name_es", "description_es")}),
    )


@admin.register(models.TeamRole)
class TeamRoleAdmin(admin.ModelAdmin):
    list_display = ["title", "hierarchy"]
    list_filter = ["hierarchy"]
    search_fields = ["title", "title_es", "summary", "summary_es"]
    fieldsets = (
        ("English", {"fields": ("title", "hierarchy",
                                "summary", "requirements", "time_commitment")}),
        ("Spanish", {"fields": ("title_es", "summary_es", "requirements_es")}),
    )


class ApplicationDocumentInline(admin.TabularInline):
    model = models.ApplicationDocument
    extra = 0
    fields = ["kind", "file", "approved"]


class MedicalDocumentInline(admin.TabularInline):
    model = models.MedicalDocument
    extra = 0
    fields = ["file", "approved"]


class ApplicationPhaseCommentInline(admin.TabularInline):
    model = models.ApplicationPhaseComment
    extra = 0
    fields = ["phase", "text", "updated_by", "updated_at"]
    readonly_fields = ["updated_at"]


class ApplicationChecklistItemInline(admin.TabularInline):
    model = models.ApplicationChecklistItem
    extra = 0
    fields = ["definition", "done"]
    autocomplete_fields = ["definition"]


@admin.register(models.ChecklistDefinition)
class ChecklistDefinitionAdmin(admin.ModelAdmin):
    list_display = ["phase", "label", "order"]
    list_display_links = ["label"]
    list_filter = ["phase"]
    search_fields = ["label"]
    ordering = ["phase", "order"]


class ApplicationLogInline(admin.TabularInline):
    model = models.ApplicationLog
    extra = 0
    fields = ["entry", "created_by", "created_at"]
    readonly_fields = ["created_at"]
    can_delete = False


@admin.register(models.VolunteerApplication)
class VolunteerApplicationAdmin(admin.ModelAdmin):
    list_display = [
        "application_code", "full_name", "country", "role_interest",
        "pipeline_phase", "submitted_at", "is_flagged", "is_rejected", "archived",
    ]
    list_filter = ["reviewed", "role_interest", "pipeline_phase", "is_flagged", "is_rejected", "archived"]
    search_fields = ["full_name", "email", "phone", "id_number", "country__name", "application_code"]
    readonly_fields = ["submitted_at", "application_code"]
    list_editable = []
    fieldsets = (
        ("Applicant", {"fields": (
            "application_code", "full_name", "email", "phone", "id_number", "country",
            "role_interest", "message", "submitted_at",
        )}),
        ("Pipeline", {"fields": (
            "pipeline_phase", "is_flagged", "is_rejected", "reviewed", "archived",
        )}),
    )
    inlines = [
        ApplicationDocumentInline,
        MedicalDocumentInline,
        ApplicationPhaseCommentInline,
        ApplicationChecklistItemInline,
        ApplicationLogInline,
    ]


@admin.register(models.Affiliation)
class AffiliationAdmin(admin.ModelAdmin):
    list_display = ["name", "url"]
    list_display_links = ["name"]
    search_fields = ["name", "name_es"]
    fieldsets = (
        ("English", {"fields": ("name", "url", "logo")}),
        ("Spanish", {"fields": ("name_es",)}),
    )


@admin.register(models.Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ["name", "partner_type", "url"]
    list_filter = ["partner_type"]
    list_display_links = ["name"]
    search_fields = ["name", "name_es"]
    fieldsets = (
        ("English", {"fields": (("name", "partner_type"), "url", "logo")}),
        ("Spanish", {"fields": ("name_es",)}),
    )


@admin.register(models.FundingNeed)
class FundingNeedAdmin(admin.ModelAdmin):
    list_display = ["item", "cost_estimate", "is_fulfilled", "order"]
    list_display_links = ["item"]
    list_editable = ["order", "is_fulfilled"]
    search_fields = ["item", "item_es"]
    fieldsets = (
        ("English", {"fields": (("item", "cost_estimate", "order"), "description", "image", "is_fulfilled")}),
        ("Spanish", {"fields": ("item_es", "description_es")}),
    )


@admin.register(models.SponsorshipTier)
class SponsorshipTierAdmin(admin.ModelAdmin):
    list_display = ["name", "annual_amount", "order"]
    list_display_links = ["name"]
    list_editable = ["order"]
    search_fields = ["name", "name_es"]
    fieldsets = (
        ("English", {"fields": (("name", "annual_amount", "order"), "benefits")}),
        ("Spanish", {"fields": ("name_es", "benefits_es")}),
    )


@admin.register(models.Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ["full_name", "role", "status", "joined_date"]
    list_filter = ["status", "role"]
    search_fields = ["full_name", "email", "phone", "id_number", "certifications", "country__name"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("Team Member", {
            "fields": ("full_name", "email", "phone", "role", ("status", "joined_date"),
                       "id_number", "country", "blood_type", "certifications", "photo")
        }),
        ("Internal", {"fields": ("notes", "created_at", "updated_at")}),
    )


@admin.register(models.ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "subject", "submitted_at", "resolved", "is_media_inquiry"]
    list_filter = ["resolved", "is_media_inquiry"]
    search_fields = ["name", "email", "subject", "message"]
    readonly_fields = ["submitted_at"]
    list_editable = ["resolved"]
    fields = [
        "name", "email", "phone", "subject", "message",
        "is_media_inquiry", "submitted_at", "resolved",
    ]


@admin.register(models.Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ["name", "name_es", "code"]
    list_display_links = ["name"]
    search_fields = ["name", "name_es", "code"]


class LookupAdminBase(admin.ModelAdmin):
    """Shared admin for status/note/note_es lookup tables with an editable key."""

    list_display = ["key", "note", "note_es", "updated_at"]
    list_display_links = ["key"]
    search_fields = ["status", "note", "note_es"]
    readonly_fields = ["updated_at"]
    fieldsets = (
        ("Record", {"fields": (("status", "updated_at"), "note", "note_es")}),
    )

    @admin.display(description="Key", ordering="status")
    def key(self, obj):
        return obj.status


@admin.register(models.MemberStatus)
class MemberStatusAdmin(LookupAdminBase):
    pass


@admin.register(models.BloodType)
class BloodTypeAdmin(LookupAdminBase):
    pass


@admin.register(models.DeploymentStatus)
class DeploymentStatusAdmin(LookupAdminBase):
    pass


@admin.register(models.CapabilityCategory)
class CapabilityCategoryAdmin(LookupAdminBase):
    pass