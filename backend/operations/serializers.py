from rest_framework import serializers
from . import models


class TeamStatusSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = models.TeamStatus
        fields = ["id", "status", "status_display", "note", "updated_at"]


class ImpactMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ImpactMetric
        fields = ["id", "label", "value", "order"]


class CapabilitySerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = models.Capability
        fields = [
            "id", "category", "category_display", "title", "summary",
            "description", "icon", "order",
        ]


class NewsUpdateSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = models.NewsUpdate
        fields = [
            "id", "title", "category", "category_display", "summary",
            "body", "published_at",
        ]


class DeploymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = models.Deployment
        fields = [
            "id", "name", "location", "status", "status_display",
            "start_date", "end_date", "summary",
        ]


class TrainingExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TrainingExercise
        fields = ["id", "title", "date", "description", "partner_agencies"]


class TeamRoleSerializer(serializers.ModelSerializer):
    track_display = serializers.CharField(source="get_track_display", read_only=True)
    requirements_list = serializers.SerializerMethodField()

    class Meta:
        model = models.TeamRole
        fields = [
            "id", "track", "track_display", "title", "slug", "summary",
            "requirements", "requirements_list", "time_commitment", "order",
        ]

    def get_requirements_list(self, obj):
        return [line.strip() for line in obj.requirements.splitlines() if line.strip()]


class TrainingPipelineStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TrainingPipelineStage
        fields = ["id", "order", "title", "description"]


class VolunteerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VolunteerApplication
        fields = [
            "id", "full_name", "email", "phone", "role_interest",
            "message", "resume", "submitted_at",
        ]
        read_only_fields = ["submitted_at"]


class LeadershipMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LeadershipMember
        fields = ["id", "name", "role_title", "bio", "photo", "order"]


class AffiliationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Affiliation
        fields = ["id", "name", "url", "logo"]


class PartnerSerializer(serializers.ModelSerializer):
    partner_type_display = serializers.CharField(source="get_partner_type_display", read_only=True)

    class Meta:
        model = models.Partner
        fields = ["id", "name", "partner_type", "partner_type_display", "url", "logo"]


class FundingNeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.FundingNeed
        fields = [
            "id", "item", "description", "cost_estimate", "image",
            "is_fulfilled", "order",
        ]


class SponsorshipTierSerializer(serializers.ModelSerializer):
    benefits_list = serializers.SerializerMethodField()

    class Meta:
        model = models.SponsorshipTier
        fields = ["id", "name", "annual_amount", "benefits", "benefits_list", "order"]

    def get_benefits_list(self, obj):
        return [line.strip() for line in obj.benefits.splitlines() if line.strip()]


class MemberSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    role_title = serializers.CharField(source="role.title", read_only=True)
    certifications_list = serializers.SerializerMethodField()

    class Meta:
        model = models.Member
        fields = [
            "id", "full_name", "email", "phone", "role", "role_title",
            "status", "status_display", "joined_date", "certifications",
            "certifications_list", "photo", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_certifications_list(self, obj):
        return [line.strip() for line in obj.certifications.splitlines() if line.strip()]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ContactMessage
        fields = [
            "id", "name", "email", "phone", "subject", "message",
            "is_media_inquiry", "submitted_at",
        ]
        read_only_fields = ["submitted_at"]
