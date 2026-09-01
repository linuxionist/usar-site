from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("status", views.TeamStatusViewSet, basename="status")
router.register("impact-metrics", views.ImpactMetricViewSet, basename="impact-metric")
router.register("capabilities", views.CapabilityViewSet, basename="capability")
router.register("news", views.NewsUpdateViewSet, basename="news")
router.register("deployments", views.DeploymentViewSet, basename="deployment")
router.register("training-exercises", views.TrainingExerciseViewSet, basename="training-exercise")
router.register("team-roles", views.TeamRoleViewSet, basename="team-role")
router.register("training-pipeline", views.TrainingPipelineStageViewSet, basename="training-pipeline")
router.register("volunteer-applications", views.VolunteerApplicationViewSet, basename="volunteer-application")
router.register("leadership", views.LeadershipMemberViewSet, basename="leadership")
router.register("affiliations", views.AffiliationViewSet, basename="affiliation")
router.register("partners", views.PartnerViewSet, basename="partner")
router.register("funding-needs", views.FundingNeedViewSet, basename="funding-need")
router.register("sponsorship-tiers", views.SponsorshipTierViewSet, basename="sponsorship-tier")
router.register("contact-messages", views.ContactMessageViewSet, basename="contact-message")
router.register("members", views.MemberViewSet, basename="member")

urlpatterns = router.urls + [
    path("auth/login/", views.AdminLoginView.as_view(), name="admin-login"),
    path("auth/me/", views.CurrentUserView.as_view(), name="current-user"),
]
