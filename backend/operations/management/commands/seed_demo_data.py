from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from operations import models


class Command(BaseCommand):
    help = "Populates the database with sample USAR team content (EN + ES) for local development."

    def handle(self, *args, **options):
        User = get_user_model()
        status, _ = models.TeamStatus.objects.update_or_create(
            id=1,
            defaults={
                "status": models.TeamStatus.READY,
                "note": "All task forces on standby.",
                "note_es": "Todos los grupos de tarea en espera.",
            },
        )

        capability_categories = [
            ("heavy_technical", "Heavy/Technical Rescue", "Rescate Pesado/Técnico"),
            ("k9", "Canine (K9) Unit", "Unidad Canina (K9)"),
            ("technical_search", "Technical Search", "Búsqueda Técnica"),
            ("medical", "Medical Task Force", "Grupo Médico de Tarea"),
            ("hazmat", "Hazardous Materials & Technical Support", "Materiales Peligrosos y Soporte Técnico"),
        ]
        cat_map = {}
        for key, note, note_es in capability_categories:
            cat, _ = models.CapabilityCategory.objects.update_or_create(
                status=key, defaults={"note": note, "note_es": note_es}
            )
            cat_map[key] = cat

        member_statuses = [
            ("active", "Active", "Activo"),
            ("probation", "Probationary", "Probatorio"),
            ("leave", "On Leave", "De Baja Temporal"),
            ("inactive", "Inactive", "Inactivo"),
        ]
        member_status_map = {}
        for key, note, note_es in member_statuses:
            obj, _ = models.MemberStatus.objects.update_or_create(
                status=key, defaults={"note": note, "note_es": note_es}
            )
            member_status_map[key] = obj

        blood_types = [
            ("A+", "A+", "A+"), ("A-", "A-", "A-"),
            ("B+", "B+", "B+"), ("B-", "B-", "B-"),
            ("AB+", "AB+", "AB+"), ("AB-", "AB-", "AB-"),
            ("O+", "O+", "O+"), ("O-", "O-", "O-"),
        ]
        blood_type_map = {}
        for key, note, note_es in blood_types:
            obj, _ = models.BloodType.objects.update_or_create(
                status=key, defaults={"note": note, "note_es": note_es}
            )
            blood_type_map[key] = obj

        deployment_statuses = [
            ("active", "Active Operation", "Operación Activa"),
            ("completed", "Completed", "Completado"),
        ]
        deployment_status_map = {}
        for key, note, note_es in deployment_statuses:
            obj, _ = models.DeploymentStatus.objects.update_or_create(
                status=key, defaults={"note": note, "note_es": note_es}
            )
            deployment_status_map[key] = obj

        metrics = [
            ("Years Active", "27", "Años Activos"),
            ("Deployments Completed", "184", "Despliegues Completados"),
            ("Lives Saved", "412", "Vidas Salvadas"),
            ("Active Volunteers", "96", "Voluntarios Activos"),
        ]
        for i, (label, value, label_es) in enumerate(metrics):
            models.ImpactMetric.objects.update_or_create(
                label=label,
                defaults={"value": value, "label_es": label_es, "order": i},
            )

        capabilities = [
            ("heavy_technical", "Structural Collapse Rescue", "Rescate en Colapso Estructural",
             "Shoring, breaching and heavy lifting for collapsed structures.",
             "Apuntalamiento, perforación y elevación pesada para estructuras colapsadas.",
             "Our heavy rescue teams stabilize and breach collapsed concrete, timber and steel "
             "structures using pneumatic shoring, hydraulic breaching tools and rigging systems "
             "rated for multi-ton loads.",
             "Nuestros equipos de rescate pesado estabilizan y perforan estructuras colapsadas de "
             "concreto, madera y acero utilizando apuntalamiento neumático, herramientas hidráulicas "
             "de perforación y sistemas de aparejo para cargas de varias toneladas."),
            ("k9", "Air-Scent & Disaster Search Dogs", "Perros de Búsqueda por Aire y Desastre",
             "FEMA-certified canine teams for live-find search.",
             "Equipos caninos certificados por FEMA para búsqueda de personas vivas.",
             "Handlers and dogs train year-round to FEMA and INSARAG live-find standards, working "
             "rubble piles, wilderness terrain and disaster debris fields.",
             "Los guías y perros se entrenan durante todo el año según los estándares FEMA e "
             "INSARAG para búsqueda de personas vivas, trabajando montículos de escombros, "
             "terrenos silvestres y campos de desechos por desastres."),
            ("technical_search", "Thermal & Acoustic Search", "Búsqueda Térmica y Acústica",
             "Thermal imaging, listening devices and robotic inspection cameras.",
             "Imágenes térmicas, dispositivos de escucha y cámaras robóticas de inspección.",
             "Search specialists deploy thermal cameras, seismic/acoustic listening devices and "
             "articulating inspection robots to locate trapped survivors without entry.",
             "Los especialistas en búsqueda despliegan cámaras térmicas, dispositivos de escucha "
             "sísmicos/acústicos y robots articulados de inspección para localizar sobrevivientes "
             "atrapados sin necesidad de ingreso."),
            ("medical", "Austere Field Medicine", "Medicina de Campo Austera",
             "Trauma care and extrication support in disaster environments.",
             "Atención de trauma y apoyo en extracción en entornos de desastre.",
             "Task force medical officers provide field trauma stabilization and work alongside "
             "rescue specialists during prolonged extrications.",
             "Los oficiales médicos del grupo de tarea brindan estabilización de trauma en campo y "
             "trabajan junto a especialistas en rescate durante extracciones prolongadas."),
            ("hazmat", "HazMat & UAV Support", "Apoyo de Materiales Peligrosos y Drones",
             "Atmospheric monitoring and drone mapping for incident command.",
             "Monitoreo atmosférico y mapeo con drones para el comando de incidentes.",
             "HazMat technicians and licensed UAV pilots provide atmospheric monitoring, aerial "
             "mapping and logistics support to incident command.",
             "Los técnicos de materiales peligrosos y pilotos de drones licenciados brindan "
             "monitoreo atmosférico, mapeo aéreo y apoyo logístico al comando de incidentes."),
        ]
        for i, (cat, title, title_es, summary, summary_es, desc, desc_es) in enumerate(capabilities):
            models.Capability.objects.update_or_create(
                title=title,
                defaults={
                    "category": cat_map[cat], "title_es": title_es,
                    "summary": summary, "summary_es": summary_es,
                    "description": desc, "description_es": desc_es, "order": i,
                },
            )

        models.NewsUpdate.objects.update_or_create(
            title="Task Force Returns from Regional Flooding Response",
            defaults={
                "title_es": "El Grupo de Tarea Regresa de la Respuesta a Inundaciones Regionales",
                "category": "dispatch",
                "summary": "18 specialists completed a 6-day swift-water and structural assessment mission.",
                "summary_es": "18 especialistas completaron una misión de 6 días de aguas rápidas y evaluación estructural.",
                "body": "Full after-action report to follow at next training night.",
                "body_es": "Informe posterior a la acción completo en la próxima noche de capacitación.",
                "published_at": timezone.now() - timedelta(days=4),
            },
        )
        models.NewsUpdate.objects.update_or_create(
            title="New Canine Handler Certification Cycle Opens",
            defaults={
                "title_es": "Se Abre el Nuevo Ciclo de Certificación de Guías Caninos",
                "category": "news",
                "summary": "Applications open for the next K9 handler certification cohort.",
                "summary_es": "Se abren las solicitudes para la próxima cohorte de certificación de guías K9.",
                "body": "",
                "body_es": "",
                "published_at": timezone.now() - timedelta(days=10),
            },
        )

        models.Deployment.objects.update_or_create(
            name="Regional Flood Response",
            defaults={
                "name_es": "Respuesta a Inundaciones Regionales",
                "location": "River Valley County",
                "location_es": "Condado del Valle del Río",
                "status": deployment_status_map["completed"],
                "start_date": date.today() - timedelta(days=20),
                "end_date": date.today() - timedelta(days=14),
                "summary": "Swift-water search and structural safety assessments across 40 affected structures.",
                "summary_es": "Búsqueda en aguas rápidas y evaluaciones de seguridad estructural en 40 estructuras afectadas.",
                "map_area": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [-84.392, 33.748],
                            [-84.38, 33.75],
                            [-84.377, 33.739],
                            [-84.391, 33.737],
                            [-84.392, 33.748],
                        ]
                    ],
                },
            },
        )

        models.TrainingExercise.objects.update_or_create(
            title="Joint Multi-Agency Collapse Drill",
            defaults={
                "title_es": "Ejercicio Conjunto de Colapso Multiagencial",
                "date": date.today() - timedelta(days=30),
                "description": "Full-scale structural collapse simulation with mutual aid partners.",
                "description_es": "Simulación de colapso estructural a gran escala con socios de ayuda mutua.",
                "partner_agencies": "City Fire Dept, County EMS, State Emergency Management",
            },
        )

        hierarchies = [
            (1, "Commander", "Comandante",
             "Overall responsibility for the task force and incident response.",
             "Responsabilidad general del grupo de tarea y de la respuesta a incidentes."),
            (2, "Deputy Commander", "Comandante Adjunto",
             "Second-in-command overseeing operations and safety.",
             "Segundo al mando, supervisa las operaciones y la seguridad."),
            (3, "Team Leader", "Líder de Equipo",
             "Leads a functional team during training and deployments.",
             "Lidera un equipo funcional durante capacitaciones y despliegues."),
            (4, "Field Specialist", "Especialista de Campo",
             "Certified member deployed in a specialist capacity.",
             "Miembro certificado desplegado en calidad de especialista."),
            (5, "Probationary Member", "Miembro Probatorio",
             "In the onboarding and probationary training pipeline.",
             "En el proceso de incorporación y capacitación probatoria."),
        ]
        hierarchy_map = {}
        for order, name, name_es, desc, desc_es in hierarchies:
            hierarchy, _ = models.Hierarchy.objects.update_or_create(
                name=name,
                defaults={"name_es": name_es, "description": desc,
                          "description_es": desc_es, "order": order},
            )
            hierarchy_map[name] = hierarchy

        roles = [
            ("Rescue Specialist", "Especialista en Rescate",
             "Structural collapse, rope and confined-space rescue operations.",
             "Operaciones de rescate en colapso estructural, cuerdas y espacios confinados.",
             "NFPA 1006 technical rescue certification\nPass annual physical agility test\n"
             "Background check\nMinimum 8 hours/month availability",
             "Certificación de rescate técnico NFPA 1006\nPasar la prueba anual de agilidad física\n"
             "Verificación de antecedentes\nDisponibilidad mínima de 8 horas/mes",
             "Field Specialist"),
            ("K9 Handler", "Guía Canino K9",
             "Train and deploy a certified live-find search dog.",
             "Entrenar y desplegar un perro de búsqueda certificado para personas vivas.",
             "FEMA canine search certification (or willingness to pursue)\n"
             "Own or co-own an eligible working dog\nWeekly training commitment",
             "Certificación de búsqueda canina FEMA (o disposición a obtenerla)\n"
             "Ser propietario o copropietario de un perro de trabajo elegible\nCompromiso de entrenamiento semanal",
             "Field Specialist"),
            ("Medical Officer", "Oficial Médico",
             "Field trauma care support during extrication operations.",
             "Apoyo de atención de trauma en campo durante operaciones de extracción.",
             "EMT-B or higher (Paramedic preferred)\nWilderness/austere medicine training a plus\n"
             "Pass annual physical agility test",
             "EMT-B o superior (preferencia Paramédico)\nEntrenamiento en medicina silvestre/austera es un plus\n"
             "Pasar la prueba anual de agilidad física",
             "Team Leader"),
            ("HazMat Specialist", "Especialista en Materiales Peligrosos",
             "Atmospheric monitoring and hazardous material mitigation.",
             "Monitoreo atmosférico y mitigación de materiales peligrosos.",
             "HazMat Technician certification\nDrone/UAV Part 107 license a plus",
             "Certificación de Técnico en Materiales Peligrosos\nLicencia de drone/UAV Parte 107 es un plus",
             "Field Specialist"),
            ("Logistics / Support Personnel", "Logística / Personal de Apoyo",
             "Equipment readiness, transport and incident command support.",
             "Preparación de equipos, transporte y apoyo al comando de incidentes.",
             "Valid driver's license (CDL a plus)\nAvailable for callout logistics",
             "Licencia de conducir vigente (CDL es un plus)\nDisponible para logística de alertamiento",
             "Team Leader"),
        ]
        for title, title_es, summary, summary_es, reqs, reqs_es, hierarchy_name in roles:
            models.TeamRole.objects.update_or_create(
                title=title,
                defaults={
                    "title_es": title_es,
                    "summary": summary, "summary_es": summary_es,
                    "requirements": reqs, "requirements_es": reqs_es,
                    "hierarchy": hierarchy_map[hierarchy_name],
                    "time_commitment": "8-16 hrs/month plus callouts",
                },
            )

        command_roles = [
            ("Task Force Commander", "Comandante del Grupo de Tarea",
             "Commanding officer of the task force.",
             "Oficial al mando del grupo de tarea.", "Commander"),
            ("Deputy Commander", "Comandante Adjunto",
             "Second-in-command overseeing operations and safety.",
             "Segundo al mando, supervisa operaciones y seguridad.", "Deputy Commander"),
        ]
        for title, title_es, summary, summary_es, hierarchy_name in command_roles:
            models.TeamRole.objects.update_or_create(
                title=title,
                defaults={
                    "title_es": title_es,
                    "summary": summary, "summary_es": summary_es,
                    "requirements": "Command experience\nCertified as USAR specialist",
                    "requirements_es": "Experiencia de mando\nCertificación como especialista USAR",
                    "hierarchy": hierarchy_map[hierarchy_name],
                    "time_commitment": "On-call command availability",
                },
            )

        leadership_members = [
            ("Alicia Reyes", "alicia.reyes@example.com", "Task Force Commander", "active",
             "Started in demolitions rescue 18 years ago; certified USAR Instructor."),
            ("Marcus Velez", "marcus.velez@example.com", "Deputy Commander", "active",
             "Former fire captain; leads the collapse-rescue specialty."),
        ]
        for full_name, email, role_title, status_key, notes in leadership_members:
            role = models.TeamRole.objects.filter(title=role_title).first()
            models.Member.objects.update_or_create(
                email=email,
                defaults={
                    "full_name": full_name, "role": role,
                    "status": member_status_map[status_key],
                    "joined_date": date.today() - timedelta(days=365),
                    "notes": notes,
                },
            )

        pipeline_phases = [
            (1, "application", "Prerequisite and Application", "Requisito Previo y Solicitud",
             "Submit your application and prerequisites.", "Envía tu solicitud y requisitos previos."),
            (2, "screening", "Screening and Background", "Evaluación y Antecedentes",
             "Background and reference screening.", "Verificación de antecedentes y referencias."),
            (3, "probation", "Physical and Practical Evaluation", "Evaluación Física y Práctica",
             "Physical and practical skills assessment.", "Evaluación de habilidades físicas y prácticas."),
            (4, "board", "Board Review and Final Approval", "Revisión del Panel y Aprobación Final",
             "Panel review and final approval.", "Revisión del panel y aprobación final."),
            (5, "active", "Training or Rejection", "Capacitación o Rechazo",
             "Onboarding training, or rejected at this stage.", "Capacitación de incorporación, o rechazo en esta etapa."),
        ]
        for number, key, name, name_es, desc, desc_es in pipeline_phases:
            models.ApplicantPipelinePhase.objects.update_or_create(
                pipeline_key=key,
                defaults={
                    "phase_number": number, "name": name, "name_es": name_es,
                    "description": desc, "description_es": desc_es,
                },
            )
        models.ApplicantPipelinePhase.objects.filter(pipeline_key="rejected").delete()

        affiliations = [
            ("INSARAG", ""),
            ("FEMA", ""),
            ("State Office of Emergency Management", "Oficina Estatal de Manejo de Emergencias"),
        ]
        for name, name_es in affiliations:
            models.Affiliation.objects.update_or_create(name=name, defaults={"name_es": name_es})

        partners = [
            ("City Fire Department", "fire_department", "Departamento de Bomberos de la Ciudad"),
            ("County Emergency Management", "agency", "Manejo de Emergencias del Condado"),
            ("Regional Disaster Relief Alliance", "ngo", "Alianza Regional de Ayuda ante Desastres"),
        ]
        for name, ptype, name_es in partners:
            models.Partner.objects.update_or_create(
                name=name, defaults={"partner_type": ptype, "name_es": name_es}
            )

        funding = [
            ("Search Camera System", "Sistema de Cámara de Búsqueda",
             "Fiber-optic search cameras for void and rubble search.",
             "Cámaras de búsqueda de fibra óptica para búsqueda en vacíos y escombros.", 4200),
            ("K9 Protective Vests", "Chalecos Protectores K9",
             "Cut and puncture-resistant vests for two working dogs.",
             "Chalecos resistentes a cortes y punciones para dos perros de trabajo.", 1800),
            ("Sonar Life Detection Unit", "Unidad de Detección de Vida por Sonar",
             "Acoustic/seismic life-detection equipment.",
             "Equipo acústico/sísmico de detección de vida.", 9500),
        ]
        for i, (item, item_es, desc, desc_es, cost) in enumerate(funding):
            models.FundingNeed.objects.update_or_create(
                item=item,
                defaults={"item_es": item_es, "description": desc,
                          "description_es": desc_es, "cost_estimate": cost, "order": i},
            )

        tiers = [
            ("Community Supporter", "Simpatizante Comunitario", 250,
             "Newsletter recognition\nInvitation to open house",
             "Reconocimiento en boletín\nInvitación a la jornada de puertas abiertas"),
            ("Response Partner", "Socio de Respuesta", 2500,
             "Logo on equipment trailer\nAll Community benefits",
             "Logotipo en el remolque de equipos\nTodos los beneficios Comunitarios"),
            ("Command Sponsor", "Patrocinador de Comando", 10000,
             "Logo on website & vehicles\nAnnual briefing with command staff",
             "Logotipo en el sitio web y vehículos\nInforme anual con el personal de comando"),
        ]
        for i, (name, name_es, amount, benefits, benefits_es) in enumerate(tiers):
            models.SponsorshipTier.objects.update_or_create(
                name=name,
                defaults={"name_es": name_es, "annual_amount": amount,
                          "benefits": benefits, "benefits_es": benefits_es, "order": i},
            )

        sample_applicants = [
            ("Marta Jiménez", "marta.jimenez@example.com", "+34 600 111 222",
             "Logistics / Support Personnel", "Available weekends; former dispatch supervisor.",
             models.VolunteerApplication.PHASE_SCREENING, False),
            ("Daniel Okafor", "d.okafor@example.com", "+34 611 222 333",
             "Rescue Specialist", "Structural engineering background, very flexible availability.",
             models.VolunteerApplication.PHASE_BOARD, True),
            ("Sofia Reina", "sofia.reina@example.com", "+34 622 333 444",
             "Logistics / Support Personnel", "Logistics coordinator looking to give back.",
             models.VolunteerApplication.PHASE_APPLICATION, False),
        ]
        app_map = {}
        for full_name, email, phone, role_title, message, phase, reviewed in sample_applicants:
            role = models.TeamRole.objects.filter(title=role_title).first()
            phase_obj = models.ApplicantPipelinePhase.objects.filter(pipeline_key=phase).first()
            app, _ = models.VolunteerApplication.objects.update_or_create(
                email=email,
                defaults={
                    "full_name": full_name, "phone": phone,
                    "role_interest": role, "message": message,
                    "reviewed": reviewed, "pipeline_phase": phase_obj,
                },
            )
            app_map[email] = app

            if phase in list(models.VolunteerApplication.PHASE_CHECKLIST):
                models.ensure_checklist_items(app, phase)

        # Give the board-phase applicant fixed ID data so admin approval
        # creates a member portal login with predictable credentials (username
        # is derived from the applicant's email).
        board_app = app_map["d.okafor@example.com"]
        board_app.id_number = "ID-2024-7711"
        board_app.application_code = "USAR-ABC123"
        board_app.save(update_fields=["id_number", "application_code"])

        for app in app_map.values():
            for item in app.checklist.all():
                if item.label not in models.VolunteerApplication.PHASE_CHECKLIST.get(item.phase, []):
                    item.delete()

        board_app = app_map["d.okafor@example.com"]
        board_comment, _ = models.ApplicationPhaseComment.objects.update_or_create(
            application=board_app,
            phase=models.VolunteerApplication.PHASE_BOARD,
            defaults={"text": "Strong rescue background; ready for board review."},
        )
        models.ensure_checklist_items(
            board_app, models.VolunteerApplication.PHASE_BOARD
        )

        screening_app = app_map["marta.jimenez@example.com"]
        models.ApplicationPhaseComment.objects.update_or_create(
            application=screening_app,
            phase=models.VolunteerApplication.PHASE_SCREENING,
            defaults={"text": "Availability confirmed; awaiting interview scheduling."},
        )

        countries = [
            ("Argentina", "Argentina", "AR"),
            ("Australia", "Australia", "AU"),
            ("Brazil", "Brasil", "BR"),
            ("Canada", "Canadá", "CA"),
            ("Chile", "Chile", "CL"),
            ("China", "China", "CN"),
            ("Colombia", "Colombia", "CO"),
            ("Costa Rica", "Costa Rica", "CR"),
            ("Ecuador", "Ecuador", "EC"),
            ("France", "Francia", "FR"),
            ("Germany", "Alemania", "DE"),
            ("Italy", "Italia", "IT"),
            ("Japan", "Japón", "JP"),
            ("Mexico", "México", "MX"),
            ("Netherlands", "Países Bajos", "NL"),
            ("New Zealand", "Nueva Zelanda", "NZ"),
            ("Peru", "Perú", "PE"),
            ("Portugal", "Portugal", "PT"),
            ("Spain", "España", "ES"),
            ("Sweden", "Suecia", "SE"),
            ("Switzerland", "Suiza", "CH"),
            ("United Kingdom", "Reino Unido", "GB"),
            ("United States", "Estados Unidos", "US"),
            ("Uruguay", "Uruguay", "UY"),
            ("Venezuela", "Venezuela", "VE"),
        ]
        for name, name_es, code in countries:
            models.Country.objects.update_or_create(
                code=code, defaults={"name": name, "name_es": name_es}
            )

        demo_member, _ = models.Member.objects.update_or_create(
            email="lena.croft@example.com",
            defaults={
                "full_name": "Lena Croft",
                "phone": "+34 633 444 555",
                "id_number": "ID-2020-3399",
                "country": models.Country.objects.filter(code="GB").first(),
                "role": models.TeamRole.objects.filter(title="Rescue Specialist").first(),
                "status": member_status_map["active"],
                "joined_date": date.today() - timedelta(days=700),
            },
        )
        portal_user, created = User.objects.get_or_create(
            username=demo_member.email.lower(),
            defaults={"email": demo_member.email, "first_name": demo_member.full_name},
        )
        if created:
            portal_user.set_password(demo_member.id_number)
            portal_user.save(update_fields=["password"])
        demo_member.user = portal_user
        demo_member.save(update_fields=["user"])

        self.stdout.write(
            self.style.SUCCESS(
                "Demo data seeded (EN + ES). "
                f"Member portal: {demo_member.email} / {demo_member.id_number} (Lena Croft). "
                "Approving Daniel Okafor creates d.okafor@example.com / ID-2024-7711."
            )
        )