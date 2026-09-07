# Manual: converts VolunteerApplication.pipeline_phase from a CharField holding
# the pipeline_key string into a ForeignKey to ApplicantPipelinePhase,
# back-filling existing rows by matching the stored key. Legacy "rejected"
# rows (kept in the active phase with is_rejected=True) are mapped to the
# active phase. Also removes the unused resume FileField.

from django.db import migrations, models
import django.db.models.deletion


def populate_application_pipeline_phase(apps, schema_editor):
    ApplicantPipelinePhase = apps.get_model("operations", "ApplicantPipelinePhase")
    VolunteerApplication = apps.get_model("operations", "VolunteerApplication")
    phase_by_key = {p.pipeline_key: p for p in ApplicantPipelinePhase.objects.all()}
    active = phase_by_key.get("active")
    for app in VolunteerApplication.objects.all():
        key = (app.pipeline_phase_legacy or "").strip()
        phase = phase_by_key.get(key)
        if phase is None:
            phase = active
        app.pipeline_phase = phase
        app.save(update_fields=["pipeline_phase"])


def repopulate_application_pipeline_phase(apps, schema_editor):
    VolunteerApplication = apps.get_model("operations", "VolunteerApplication")
    for app in VolunteerApplication.objects.all():
        app.pipeline_phase_legacy = app.pipeline_phase.pipeline_key
        app.save(update_fields=["pipeline_phase_legacy"])


class Migration(migrations.Migration):

    dependencies = [
        ('operations', '0014_member_blood_type_member_country_member_id_number_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='volunteerapplication',
            old_name='pipeline_phase',
            new_name='pipeline_phase_legacy',
        ),
        migrations.AddField(
            model_name='volunteerapplication',
            name='pipeline_phase',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='applications', to='operations.applicantpipelinephase', verbose_name='Pipeline phase'),
        ),
        migrations.RunPython(populate_application_pipeline_phase, repopulate_application_pipeline_phase),
        migrations.RemoveField(
            model_name='volunteerapplication',
            name='pipeline_phase_legacy',
        ),
        migrations.RemoveField(
            model_name='volunteerapplication',
            name='resume',
        ),
    ]