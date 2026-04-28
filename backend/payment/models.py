from django.db import models

class PaymentMethod(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    instructions = models.TextField(help_text="Instructions for the user to make a payment (e.g., number to transfer to).")
    is_active = models.BooleanField(default=True)
    icon = models.ImageField(upload_to='payment_methods/icons/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Subscription(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='subscriptions')
    course = models.ForeignKey('learning.Course', on_delete=models.CASCADE, related_name='subscriptions')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    receipt_image = models.ImageField(upload_to='payment_receipts/', blank=True, null=True)
    is_active = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending Approval'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.course} ({self.status})"
