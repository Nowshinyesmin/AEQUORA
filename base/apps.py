from django.apps import AppConfig


class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'base'

    # We are NOT loading signals to keep things simple for now.
    # If you later need signals, you can uncomment and adjust.
    # def ready(self):
    #     import base.signals
