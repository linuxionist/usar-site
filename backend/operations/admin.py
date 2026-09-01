from django.contrib import admin
from . import models

admin.site.site_header = "USAR Team Administration"


@admin.register(models.TeamStatus)
class TeamStatusAdmin(admin.ModelAdmin):
    list_display = ["status", "note", "updated_at"]


@admin.register(models.ImpactMetric)
class ImpactMetricAdmin(admin.ModelAdmin):
    list_display = ["label", "value", "order"]
    list_editable = ["order"]


@admin.register(models.Capability)
class CapabilityAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "order"]
    list_filter = ["category"]
    list_editable = ["order"]


@admin.register(models.NewsUpdate)
class NewsUpdateAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "published_at", "is_published"]
    list_filter = ["category", "is_published"]
    date_hierarchy = "published_at"


@admin.register(models.Deployment)
class DeploymentAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "status", "start_date", "is_public"]
    list_filter = ["status", "is_public"]


@admin.register(models.TrainingExercise)
class TrainingExerciseAdmin(admin.ModelAdmin):
    list_display = ["title", "date"]


@admin.register(models.TeamRole)
class TeamRoleAdmin(admin.ModelAdmin):
    list_display = ["title", "track", "order"]
    prepopulated_fields = {"slug": ("title",)}
    list_editable = ["order"]


@admin.register(models.TrainingPipelineStage)
class TrainingPipelineStageAdmin(admin.ModelAdmin):
    list_display = ["order", "title"]
    list_editable = ["title"]


@admin.register(models.VolunteerApplication)
class VolunteerApplicationAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "role_interest", "submitted_at", "reviewed"]
    list_filter = ["reviewed", "role_interest"]


@admin.register(models.LeadershipMember)
class LeadershipMemberAdmin(admin.ModelAdmin):
    list_display = ["name", "role_title", "order"]
    list_editable = ["order"]


@admin.register(models.Affiliation)
class AffiliationAdmin(admin.ModelAdmin):
    list_display = ["name", "url"]


@admin.register(models.Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ["name", "partner_type", "url"]
    list_filter = ["partner_type"]


@admin.register(models.FundingNeed)
class FundingNeedAdmin(admin.ModelAdmin):
    list_display = ["item", "cost_estimate", "is_fulfilled", "order"]
    list_editable = ["order", "is_fulfilled"]


@admin.register(models.SponsorshipTier)
class SponsorshipTierAdmin(admin.ModelAdmin):
    list_display = ["name", "annual_amount", "order"]
    list_editable = ["order"]


@admin.register(models.Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ["full_name", "role", "status", "joined_date"]
    list_filter = ["status", "role"]
    search_fields = ["full_name", "email"]


@admin.register(models.ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "subject", "submitted_at", "resolved", "is_media_inquiry"]
    list_filter = ["resolved", "is_media_inquiry"]
