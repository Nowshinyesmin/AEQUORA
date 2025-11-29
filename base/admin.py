#from django.contrib import admin

# Register your models here.


from django.contrib import admin
from django.apps import apps

# 1. Get the configuration for your 'api' app
app_config = apps.get_app_config('base')

# 2. Get all models (tables) from that app
models = app_config.get_models()

# 3. Register each model to the Admin site
for model in models:
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass