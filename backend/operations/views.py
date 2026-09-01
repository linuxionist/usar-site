from rest_framework import viewsets, mixins, filters, permissions
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from . import models, serializers


class TeamStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """Exposes only the most recent status record — powers the homepage dashboard."""

    serializer_class = serializers.TeamStatusSerializer

    def get_queryset(self):
        return models.TeamStatus.objects.order_by("-updated_at")[:1]


class ImpactMetricViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.ImpactMetric.objects.all()
    serializer_class = serializers.ImpactMetricSerializer


class CapabilityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Capability.objects.all()
    serializer_class = serializers.CapabilitySerializer
    filterset_fields = ["category"]


class NewsUpdateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.NewsUpdateSerializer
    filterset_fields = ["category"]

    def get_queryset(self):
        return models.NewsUpdate.objects.filter(
            is_published=True, published_at__lte=timezone.now()
        )


class DeploymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.DeploymentSerializer
    filterset_fields = ["status"]

    def get_queryset(self):
        return models.Deployment.objects.filter(is_public=True)


class TrainingExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.TrainingExercise.objects.all()
    serializer_class = serializers.TrainingExerciseSerializer


class TeamRoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.TeamRole.objects.all()
    serializer_class = serializers.TeamRoleSerializer
    lookup_field = "slug"


class TrainingPipelineStageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.TrainingPipelineStage.objects.all()
    serializer_class = serializers.TrainingPipelineStageSerializer


class VolunteerApplicationViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Write-only endpoint: the public site submits applications, staff review in /admin."""

    queryset = models.VolunteerApplication.objects.all()
    serializer_class = serializers.VolunteerApplicationSerializer


class LeadershipMemberViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.LeadershipMember.objects.all()
    serializer_class = serializers.LeadershipMemberSerializer


class AffiliationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Affiliation.objects.all()
    serializer_class = serializers.AffiliationSerializer


class PartnerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Partner.objects.all()
    serializer_class = serializers.PartnerSerializer
    filterset_fields = ["partner_type"]


class FundingNeedViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.FundingNeed.objects.all()
    serializer_class = serializers.FundingNeedSerializer


class SponsorshipTierViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.SponsorshipTier.objects.all()
    serializer_class = serializers.SponsorshipTierSerializer


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Write-only endpoint for the Contact page's general-inquiry form."""

    queryset = models.ContactMessage.objects.all()
    serializer_class = serializers.ContactMessageSerializer


class MemberViewSet(viewsets.ModelViewSet):
    """Full CRUD roster of team members — staff-only, powers the admin module."""

    queryset = models.Member.objects.all()
    serializer_class = serializers.MemberSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ["status", "role"]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["full_name", "email", "certifications"]
    ordering_fields = ["full_name", "joined_date", "status"]


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
