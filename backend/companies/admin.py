from django.contrib import admin

from companies.models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ["company_name", "contact_person", "email", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["company_name", "contact_person", "email"]
