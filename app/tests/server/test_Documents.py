""" 

* Purpose :

* Creation Date : 20-11-2014

* Last Modified : Do 20 Nov 2014 14:33:53 CET

* Author :  mattis

* Coauthors :   

* Sprintnumber : 2

* Backlog entry : 

"""

from django.test import TestCase,Client
from django.contrib.auth.models import User
from core.settings import LOGIN_URL, ERROR_MESSAGES
import json




class LoginTestClass(TestCase):
    def setUp(self):
        self._client=client=Client()
       
    def test_exportToPdfWithoutSendingAllParameters(self):
        client=self._client 
        response=client.post('/updatePdf/',{})
        print(response.content)
