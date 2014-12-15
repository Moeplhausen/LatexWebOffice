# -*- coding: utf-8 -*-
"""

* Purpose : Test des Projectmodells (app/models/project.py)

* Creation Date : 26-11-2014

* Last Modified : Mi 26 Nov 2014 20:39:13 CET

* Author :  maltsev

* Sprintnumber : 2

* Backlog entry :

"""
from django.core.exceptions import ObjectDoesNotExist
from app.models.folder import Folder
from app.models.project import Project
from app.models.projecttemplate import ProjectTemplate
from app.models.file.file import File
from app.tests.server.models.modeltestcase import ModelTestCase

class ProjectTestCase(ModelTestCase):
    def setUp(self):
        self.setUpProject()

    def test_reateFromProjectTemplate(self):
        projectTemplate = ProjectTemplate.objects.get(pk=self.project.pk)
        project = Project.objects.createFromProjectTemplate(template=projectTemplate, name="Testprojekt")

        self.assertEqual("Testprojekt", project.name)
        self.assertEqual(len(projectTemplate.rootFolder.getFilesAndFoldersRecursively()),
                         len(project.rootFolder.getFilesAndFoldersRecursively()))

    def test_getProject(self):
        self.assertEqual(self.project, self.rootFolder.getProject())
        self.assertEqual(self.project, self.rootFolder_dir1.getProject())

    def test_cascadeDeleteRootFolder(self):
        self.rootFolder.delete()
        self.checkCascadeDelete()

    def test_cascadeDeleteProject(self):
        self.project.delete()
        self.checkCascadeDelete()

    def test_mainTex(self):
        self.mainTexFile.source_code = 'test src'
        self.mainTexFile.save()
        self.assertEqual('test src', self.project.rootFolder.getMainTex().source_code)

    def checkCascadeDelete(self):
        self.assertRaises(ObjectDoesNotExist, ProjectTemplate.objects.get, pk=self.project.pk)
        self.assertRaises(ObjectDoesNotExist, Project.objects.get, pk=self.project.pk)
        self.assertRaises(ObjectDoesNotExist, Folder.objects.get, pk=self.rootFolder.pk)
        self.assertRaises(ObjectDoesNotExist, Folder.objects.get, pk=self.rootFolder_dir1.pk)
        self.assertRaises(ObjectDoesNotExist, File.objects.get, pk=self.rootFolder_dir1_file1.pk)
        self.assertRaises(ObjectDoesNotExist, File.objects.get, pk=self.mainTexFile.pk)