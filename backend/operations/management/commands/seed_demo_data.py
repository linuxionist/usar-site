from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from operations import models


class Command(BaseCommand):
    help = "Populates the database with sample USAR team content for local development."

    def handle(self, *args, **options):
        status, _ = models.TeamStatus.objects.get_or_create(
            id=1, defaults={"status": models.TeamStatus.READY, "note": "All task forces on standby."}
        )

        metrics = [
            ("Years Active", "27"), ("Deployments Completed", "184"),
            ("Lives Saved", "412"), ("Active Volunteers", "96"),
        ]
        for i, (label, value) in enumerate(metrics):
            models.ImpactMetric.objects.get_or_create(label=label, defaults={"value": value, "order": i})

        capabilities = [
            ("heavy_technical", "Structural Collapse Rescue",
             "Shoring, breaching and heavy lifting for collapsed structures.",
             "Our heavy rescue teams stabilize and breach collapsed concrete, timber and steel "
             "structures using pneumatic shoring, hydraulic breaching tools and rigging systems "
             "rated for multi-ton loads."),
            ("k9", "Air-Scent & Disaster Search Dogs",
             "FEMA-certified canine teams for live-find search.",
             "Handlers and dogs train year-round to FEMA and INSARAG live-find standards, working "
             "rubble piles, wilderness terrain and disaster debris fields."),
            ("technical_search", "Thermal & Acoustic Search",
             "Thermal imaging, listening devices and robotic inspection cameras.",
             "Search specialists deploy thermal cameras, seismic/acoustic listening devices and "
             "articulating inspection robots to locate trapped survivors without entry."),
            ("medical", "Austere Field Medicine",
             "Trauma care and extrication support in disaster environments.",
             "Task force medical officers provide field trauma stabilization and work alongside "
             "rescue specialists during prolonged extrications."),
            ("hazmat", "HazMat & UAV Support",
             "Atmospheric monitoring and drone mapping for incident command.",
             "HazMat technicians and licensed UAV pilots provide atmospheric monitoring, aerial "
             "mapping and logistics support to incident command."),
        ]
        for i, (cat, title, summary, desc) in enumerate(capabilities):
            models.Capability.objects.get_or_create(
                title=title, defaults={"category": cat, "summary": summary, "description": desc, "order": i}
            )

        models.NewsUpdate.objects.get_or_create(
            title="Task Force Returns from Regional Flooding Response",
            defaults={
                "category": "dispatch",
                "summary": "18 specialists completed a 6-day swift-water and structural assessment mission.",
                "body": "Full after-action report to follow at next training night.",
                "published_at": timezone.now() - timedelta(days=4),
            },
        )
        models.NewsUpdate.objects.get_or_create(
            title="New Canine Handler Certification Cycle Opens",
            defaults={
                "category": "news",
                "summary": "Applications open for the next K9 handler certification cohort.",
                "published_at": timezone.now() - timedelta(days=10),
            },
        )

        models.Deployment.objects.get_or_create(
            name="Regional Flood Response",
            location="River Valley County",
            defaults={
                "status": "completed",
                "start_date": date.today() - timedelta(days=20),
                "end_date": date.today() - timedelta(days=14),
                "summary": "Swift-water search and structural safety assessments across 40 affected structures.",
            },
        )

        models.TrainingExercise.objects.get_or_create(
            title="Joint Multi-Agency Collapse Drill",
            date=date.today() - timedelta(days=30),
            defaults={"description": "Full-scale structural collapse simulation with mutual aid partners.",
                      "partner_agencies": "City Fire Dept, County EMS, State Emergency Management"},
        )

        roles = [
            ("rescue_specialist", "Rescue Specialist", "rescue-specialist",
             "Structural collapse, rope and confined-space rescue operations.",
             "NFPA 1006 technical rescue certification\nPass annual physical agility test\n"
             "Background check\nMinimum 8 hours/month availability"),
            ("k9_handler", "K9 Handler", "k9-handler",
             "Train and deploy a certified live-find search dog.",
             "FEMA canine search certification (or willingness to pursue)\n"
             "Own or co-own an eligible working dog\nWeekly training commitment"),
            ("medical_officer", "Medical Officer", "medical-officer",
             "Field trauma care support during extrication operations.",
             "EMT-B or higher (Paramedic preferred)\nWilderness/austere medicine training a plus\n"
             "Pass annual physical agility test"),
            ("hazmat_specialist", "HazMat Specialist", "hazmat-specialist",
             "Atmospheric monitoring and hazardous material mitigation.",
             "HazMat Technician certification\nDrone/UAV Part 107 license a plus"),
            ("logistics", "Logistics / Support Personnel", "logistics-support",
             "Equipment readiness, transport and incident command support.",
             "Valid driver's license (CDL a plus)\nAvailable for callout logistics"),
        ]
        for i, (track, title, slug, summary, reqs) in enumerate(roles):
            models.TeamRole.objects.get_or_create(
                slug=slug,
                defaults={"track": track, "title": title, "summary": summary,
                          "requirements": reqs, "time_commitment": "8-16 hrs/month plus callouts",
                          "order": i},
            )

        stages = [
            (1, "Application & Interview", "Submit your application and complete a panel interview."),
            (2, "Background & Reference Check", "Standard background screening for emergency responders."),
            (3, "Physical Agility Test", "NFPA/FEMA-aligned agility and endurance assessment."),
            (4, "Probationary Training", "6-month probation with mentorship and required certifications."),
            (5, "Full Activation", "Cleared for callouts and ongoing continuing education."),
        ]
        for order, title, desc in stages:
            models.TrainingPipelineStage.objects.get_or_create(
                order=order, defaults={"title": title, "description": desc}
            )

        affiliations = ["INSARAG", "FEMA", "State Office of Emergency Management"]
        for name in affiliations:
            models.Affiliation.objects.get_or_create(name=name)

        partners = [
            ("City Fire Department", "fire_department"),
            ("County Emergency Management", "agency"),
            ("Regional Disaster Relief Alliance", "ngo"),
        ]
        for name, ptype in partners:
            models.Partner.objects.get_or_create(name=name, defaults={"partner_type": ptype})

        funding = [
            ("Search Camera System", "Fiber-optic search cameras for void and rubble search.", 4200),
            ("K9 Protective Vests", "Cut and puncture-resistant vests for two working dogs.", 1800),
            ("Sonar Life Detection Unit", "Acoustic/seismic life-detection equipment.", 9500),
        ]
        for i, (item, desc, cost) in enumerate(funding):
            models.FundingNeed.objects.get_or_create(
                item=item, defaults={"description": desc, "cost_estimate": cost, "order": i}
            )

        tiers = [
            ("Community Supporter", 250, "Newsletter recognition\nInvitation to open house"),
            ("Response Partner", 2500, "Logo on equipment trailer\nAll Community benefits"),
            ("Command Sponsor", 10000, "Logo on website & vehicles\nAnnual briefing with command staff"),
        ]
        for i, (name, amount, benefits) in enumerate(tiers):
            models.SponsorshipTier.objects.get_or_create(
                name=name, defaults={"annual_amount": amount, "benefits": benefits, "order": i}
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))
