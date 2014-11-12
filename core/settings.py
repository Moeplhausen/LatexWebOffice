"""
Django settings for latexweboffice project.

For more information on this file, see
https://docs.djangoproject.com/en/1.7/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.7/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
from django.conf.global_settings import TEMPLATE_CONTEXT_PROCESSORS
BASE_DIR = os.path.dirname(os.path.dirname(__file__))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.7/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '(8(dm&)%e!5i9yhi5hs!6lecx!$^23usn3b&2=y2+#z_+&is)i'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

TEMPLATE_DEBUG = True

ALLOWED_HOSTS = []

TEMPLATE_CONTEXT_PROCESSORS+=('app.contextprocessors.settingsprocessor.error_messages',)

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'app'
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'core.urls'

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.7/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.7/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Berlin'

USE_I18N = True

USE_L10N = True

USE_TZ = True

LOGIN_URL = '/login/'

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.7/howto/static-files/

STATIC_URL = '/static/'

# error messages
ERROR_MESSAGES = {
    'EMAILALREADYEXISTS': 'E-Mail-Adresse ist bereits registriert.',
    'INVALIDEMAIL': 'Ungültige E-Mail-Adresse',
    'NOEMPTYFIELDS': 'Keine leeren Eingaben erlaubt.',
    'PASSWORDSDONTMATCH': 'Passwörter stimmen nicht überein.',
    'INACTIVEACCOUNT': '{0} ist nicht verifiziert.',
    'WRONGLOGINCREDENTIALS': 'E-Mail-Adresse oder Passwort falsch.',
    'LOGINORREGFAILED': 'Anmeldung nach Registrierung fehlgeschlagen.',
    'INVALIDCHARACTERINFIRSTNAME': 'Vorname enthält ungültiges Zeichen.',
    'NOSPACESINPASSWORDS': 'Passwort darf keine Leerzeichen enthalten.'
}
