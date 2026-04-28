from django.contrib import admin
from .models import PaymentMethod, Subscription

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'payment_method', 'status', 'is_active', 'created_at')
    list_filter = ('status', 'is_active')
    search_fields = ('user__email', 'course__title', 'transaction_id')
    actions = ['approve_subscriptions', 'reject_subscriptions']

    def approve_subscriptions(self, request, queryset):
        queryset.update(status='approved', is_active=True)
    approve_subscriptions.short_description = "Approve selected subscriptions"

    def reject_subscriptions(self, request, queryset):
        queryset.update(status='rejected', is_active=False)
    reject_subscriptions.short_description = "Reject selected subscriptions"
