from django.db import migrations, models
import django.db.models.deletion


def populate_definitions(apps, schema_editor):
    ApplicationChecklistItem = apps.get_model("operations", "ApplicationChecklistItem")
    ChecklistDefinition = apps.get_model("operations", "ChecklistDefinition")

    defs = {}
    for item in ApplicationChecklistItem.objects.all().iterator():
        key = (item.phase, item.label)
        if key not in defs:
            defs[key], _ = ChecklistDefinition.objects.get_or_create(
                phase=item.phase, label=item.label
            )
        item.definition = defs[key]
        item.save(update_fields=["definition"])


class Migration(migrations.Migration):

    dependencies = [
        ("operations", "0012_country"),
    ]

    operations = [
        migrations.CreateModel(
            name="ChecklistDefinition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phase", models.CharField(choices=[
                    ("application", "Phase 1: Application submitted"),
                    ("screening", "Phase 2: Screening & Interview"),
                    ("probation", "Phase 3: Probation & Training"),
                    ("board", "Phase 4: Board Review"),
                    ("active", "Active Duty"),
                    ("rejected", "Rejected"),
                ], max_length=20)),
                ("label", models.CharField(max_length=255)),
                ("order", models.PositiveIntegerField(default=0)),
            ],
            options={
                "ordering": ["phase", "order"],
            },
        ),
        migrations.AddField(
            model_name="applicationchecklistitem",
            name="definition",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="items",
                to="operations.checklistdefinition",
            ),
        ),
        migrations.RunPython(populate_definitions, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="applicationchecklistitem",
            name="label",
        ),
        migrations.RemoveField(
            model_name="applicationchecklistitem",
            name="phase",
        ),
        migrations.AlterField(
            model_name="applicationchecklistitem",
            name="definition",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="items",
                to="operations.checklistdefinition",
            ),
        ),
        migrations.AddConstraint(
            model_name="checklistdefinition",
            constraint=models.UniqueConstraint(fields=("phase", "label"), name="uniq_checklist_def_phase_label"),
        ),
        migrations.AddConstraint(
            model_name="applicationchecklistitem",
            constraint=models.UniqueConstraint(fields=("application", "definition"), name="uniq_app_checklist_definition"),
        ),
    ]
