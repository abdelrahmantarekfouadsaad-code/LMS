from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentMethodViewSet, SubscriptionViewSet

router = DefaultRouter()
router.register(r'methods', PaymentMethodViewSet, basename='paymentmethod')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = router.urls
