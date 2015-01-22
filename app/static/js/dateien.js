﻿/*
@author: Timo Dümke, Ingolf Bracht, Kirill Maltsev
@creation: 12.12.2014 - sprint-nr: 3
@last-change: 15.01.2015 - sprint-nr: 4
*/
$(function () {
    // ID zum vorliegenden Projekt
	var rootFolderId = parseInt(location.hash.substr(1), 10);
	if (! rootFolderId) {
		window.location.replace("/projekt/");
	    return;
	}

    reloadProject();


	// -------------------------------------------------------------------------
	//                              MENÜ-EINTRÄGE
	// -------------------------------------------------------------------------

    // "Öffnen"-Schaltfläche
	$(".filestoolbar-open").click(function() {
		openSelectedNode();
	});

	// "Datei Erstellen"-Schaltfläche
	$(".filestoolbar-newfile").click(function() {
        var name = prompt("Geben Sie den Tex-Dateiname ein:");
        if (! name) {
            return;
        }

        // Vermeiden "filename.tex.tex" Namen
        name = name.replace(/\.tex/i, "") + ".tex";

        var selectedFolderId = getSelectedFolderId();

        documentsJsonRequest({command: "createtex", id: selectedFolderId, name: name}, function(result, data) {
            if (! result) {
                alert(data.response);
                return;
            }

            reloadProject();
        });
	});

	// "Verzeichnis Erstellen"-Schaltfläche
	$(".filestoolbar-newfolder").click(function() {
        var name = prompt("Geben Sie den Verzeichnisname ein:");
        if (! name) {
            return;
        }

        var selectedFolderId = getSelectedFolderId();

        documentsJsonRequest({command: "createdir", id: selectedFolderId, name: name}, function(result, data) {
            if (! result) {
                alert(data.response);
                return;
            }

            reloadProject();
        });
	});

	// "Löschen"-Schaltfläche
	$(".filestoolbar-delete").click(function() {
		deleteSelectedNode();
	});

	// "Umbenennen"-Schaltfläche
	$(".filestoolbar-rename").click(function() {
        var newName = prompt("Geben Sie den neuen Name ein:");
        if (! newName) {
            return;
        }

        var selectedNode = getSelectedNode(),
            commandName = selectedNode.hasClass("filesitem-folder") ? "renamedir" : "renamefile",
            itemId = selectedNode.data("file-id") || selectedNode.data("folder-id");

        if (selectedNode.hasClass("filesitem-file") && newName.indexOf(".") === -1) {
            alert("Bitte auch die Dateinamenserweiterung eingeben");
            return;
        }

        documentsJsonRequest({command: commandName, id: itemId, name: newName}, function(result, data) {
            if (! result) {
                alert(data.response);
                return;
            }

            $("> .jstree-anchor .filesitem-name", selectedNode).text(newName);
        });
	});

	// "Herunterladen"-Schaltfläche
	$(".filestoolbar-download").click(function() {
	    var selectedNode = getSelectedNode();
		if (selectedNode.hasClass("filesitem-file")) {
			documentsRedirect({
				'command': 'downloadfile',
				'id': selectedNode.data("file-id")
			});
		} else if (selectedNode.hasClass("filesitem-folder")) {
			documentsRedirect({
				'command': 'exportzip',
				'id': selectedNode.data("folder-id")
			});
		}
	});

	// "Hochladen"-Schaltfläche
	$(".filestoolbar-upload").click(function() {
		dialogUploadFile();
	});



    function reloadProject() {
        documentsJsonRequest({command: "listfiles", id: rootFolderId}, function(result, data) {
            if (! result) {
                alert(ERROR_MESSAGES.PROJECTNOTEXIST);
                return;
            }

            renderProject(data.response);
            updateMenuButtons();
        });
    }


    // folder: {icon: "glyphicon glyphicon-folder-open"},
    // emptyFolder: {icon: "glyphicon glyphicon-folder-close"},
    // file: {icon: "glyphicon glyphicon-file"},
    // pdf: {icon: "glyphicon glyphicon-book"}

    var tree = null;
    function renderProject(data) {
        var jsTreeData = convertRawDataToJsTreeData(data);

        if (tree) {
            tree.jstree(true).settings.core.data = jsTreeData;
            tree.jstree(true).refresh();
            return;
        }

        tree = $(".fileswrapper").jstree({
            core: {
                check_callback: true,
                multiple: false,
                data: jsTreeData
            },

            dnd: {
                "inside_pos": "last"
            },

            types: {
                "default":{
                    "icon" : "glyphicon glyphicon-file",
                    "valid_children": []
                },
                "file":{
                    "icon" : "glyphicon glyphicon-file",
                    "valid_children": []
                },
                "folder":{
                    "icon" : "glyphicon glyphicon-folder-open",
                    "valid_children": ["file", "default", "folder"]
                }
            },

            plugins: ["types", "dnd", "state"]
        });

        var jstree = $(".fileswrapper").jstree(true);

        tree.on({
            // Auswahl-Listener
            "select_node.jstree": function (e, data) {
                updateMenuButtons();
            },

            // Auswahl-Entfernen-Listener
            "deselect_node.jstree": function (e, data) {
                updateMenuButtons();
            },

            // Doppelklick-Listener
            "dblclick.jstree": function (e, data) {
            	openSelectedNode();
            },

            // Tasten-Listener
            "keydown": function (e, data) {
            	/*
            	// ENTER-Taste
            	if (e.keyCode === 13)
            		openSelectedNode();
            	*/

            	// ENTF-Taste
            	if (e.keyCode === 46)
        			deleteSelectedNode();
            },

            "ready.jstree refresh.jstree before_open.jstree": function () {
                $(".jstree-node").each(function () {
                    var node = $(this),
                        type = node.hasClass("filesitem-folder") ? "folder" : "file";

                    jstree.set_type(node, type);
                });
            }
        });

        $(document).on({
            "dnd_stop.vakata": function (event, data) {
                var node = jstree.get_node(data.data.nodes[0]),
                    nodeId = node.li_attr["data-file-id"] || node.li_attr["data-folder-id"],
                    command = node.type === "folder" ? "movedir" : "movefile",
                    folderId = parseInt(node.parent.replace("folder", ""), 10) || rootFolderId;

                documentsJsonRequest({command: command, id: nodeId, folderid: folderId}, function(result, data) {
                    if (! result) {
                        alert(data.response);
                        return;
                    }
                });
            },
        });
    }

    /**
     * Öffnet den ausgewählten Knoten im Editor.
     */
    function openSelectedNode() {
    	var node = getSelectedNode();

    	// ist ein Knoten ausgewählt?
    	if (node.length) {
    		// Text- oder TEX-Datei?
    		if ($.inArray(node.data("file-mime"), ["text/x-tex", "text/plain"]) !== -1)
    		window.location.assign("/editor/#" + node.data("file-id"));
    	}
    }

    /**
     * Zeigt einen Dialog zum Löschen des ausgewählten Knotens an.
     */
    function deleteSelectedNode() {
    	var node = getSelectedNode();

    	// ist ein Knoten ausgewählt?
    	if (node.length) {
    		var isFile = node.hasClass("filesitem-file");
    		$('.filesdialog-delete-title').text('Löschen ' + (isFile ? 'der Datei' : 'des Ordners')
    				+ ' bestätigen');
    		$('.filesdialog-delete-text').text('Sind Sie sicher, dass Sie ' + (isFile ? 
    				'die ausgewählte Datei' : 'den ausgewählten Ordner') + ' löschen wollen?');

    		$('.filesdialog-delete-yes').unbind();
    		$('.filesdialog-delete-yes').click(node, function(event) {
    			if (event.data.hasClass("filesitem-file")) {
					documentsJsonRequest({
						'command': 'deletefile',
						'id': event.data.data("file-id")
					}, function(result, data) {
						if (result) {
							reloadProject();
							tree.focus();
						}
					});
				} else if (event.data.hasClass("filesitem-folder")) {
					documentsJsonRequest({
						'command': 'rmdir',
						'id': event.data.data("folder-id")
					}, function(result, data) {
						if (result) {
							reloadProject();
							tree.focus();
						}
					});
				}
    		});

    		$('.filesdialog-delete-no').unbind();
    		$('.filesdialog-delete-no').click(function() {
    			tree.focus();
    		});

    		$('.filesdialog-delete').modal('show');
    	}
    }

    /**
     * Zeigt einen Dialog zum Hochladen einer Datei an.
     */
    function dialogUploadFile() {
    	var node = getSelectedNode();

    	$('.filesdialog-upload-message').addClass('invisible');

    	$('.filesdialog-upload-files').val('');
    	$('.filesdialog-upload-folderid').val(node.length ?
    			getSelectedFolderId() : rootFolderId);

    	$('.filesdialog-upload-do').prop('disabled', false);
    	$('.filesdialog-upload-do').unbind();
		$('.filesdialog-upload-do').click(function() {
			$('.filesdialog-upload-form').submit();
		});

		$('.filesdialog-upload-abort').unbind();
		$('.filesdialog-upload-abort').click(function() {
			tree.focus();
		});

		$('.filesdialog-upload-form').unbind();
    	$('.filesdialog-upload-form').submit(function(event) {
    		// Formular deaktivieren
    		event.preventDefault();
    		$('.filesdialog-upload-do').prop('disabled', true);

    		// Dateien senden
    		var form = new FormData(this);
    		documentsJsonRequest(form, function(result, data) {
    			reloadProject();
    			if (result && data.response.failure.length == 0) {
    				$('.filesdialog-upload').modal('hide');
    				tree.focus();
    			} else {
    				var msg = $('.filesdialog-upload-message');
    				msg.text('Fehler beim Hochladen!');
    				for (var i = 0; i < data.response.failure.length; ++i)
    					msg.append($('<br />'))
    							.append($('<b></b>').text(data.response.failure[i].name))
    							.append(document.createTextNode(': ' + 
    									data.response.failure[i].reason));
    				msg.removeClass('invisible');

    				$('.filesdialog-upload-do').prop('disabled', false);
    			}
    		}, false, false);
    	});

    	$('.filesdialog-upload').modal('show');
    }


    var fileTemplate = doT.template($("#template_filesitem-file").text()),
        folderTemplate = doT.template($("#template_filesitem-folder").text());

    function convertRawDataToJsTreeData(rawData) {
        var jsTreeData = [];

        $.each(rawData.folders || [], function (i, folder) {
            jsTreeData.push({
                id: "folder" + folder.id,
                text: folderTemplate(folder),
                li_attr: {"class": "filesitem-folder", "data-folder-id": folder.id},
                children: convertRawDataToJsTreeData(folder)
            });
        });

        $.each(rawData.files || [], function (i, file) {
            file.createTime = getRelativeTime(file.createTime);
            file.lastModifiedTime = getRelativeTime(file.lastModifiedTime);
            file.size = Math.round(file.size / 1024); // in KB

            jsTreeData.push({
                id: "file" + file.id,
                text: fileTemplate(file),
                li_attr: {"class": "filesitem-file", "data-file-id": file.id, "data-file-mime": file.mimetype}
            });
        });

        return jsTreeData;
    }

    /*
     * Gibt das ID des ausgewähltes Verzeichnisses zurück (auch für ausgewählte Dateien)
     */
    function getSelectedFolderId() {
        var selectedNode = getSelectedNode();

        if (selectedNode.hasClass("filesitem-folder")) {
            var selectedFolder = selectedNode;
        } else {
            selectedFolder = selectedNode.closest(".filesitem-folder");
        }

        return selectedFolder.data("folder-id") || rootFolderId;
    }


    function getSelectedNode() {
        return $("#" + tree.jstree().get_selected());
    }


    /*
     * Aktualisiert die Aktivierungen der Menü-Schaltflächen.
     */
    function updateMenuButtons() {
        var selectedNode = getSelectedNode();

        // flag für die Aktivierung der nicht-selektionsabhängigen Schaltflächen ("Erstellen" und "Hochladen")
        var basic = true;

        // flag für die Aktivierung der selektionsabhängigen Schaltflächen
        var selected = selectedNode.length;
        var folder = selected && selectedNode.hasClass("filesitem-folder");
        var file = selected && selectedNode.hasClass("filesitem-file");
        var textFile = file && 
        		$.inArray(selectedNode.data("file-mime"), ["text/x-tex", "text/plain"]) !== -1;

        // setzt die Aktivierungen der einzelnen Menü-Schaltflächen
        $(".filestoolbar-open").prop("disabled", !textFile);
        $(".filestoolbar-newfile").prop("disabled", !basic);
        $(".filestoolbar-newfolder").prop("disabled", !basic);
        $(".filestoolbar-delete").prop("disabled", !selected);
        $(".filestoolbar-rename").prop("disabled", !selected);
        $(".filestoolbar-download").prop("disabled", !selected);
        $(".filestoolbar-upload").prop("disabled", !basic);
    }
});