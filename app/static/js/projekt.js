/*
 * @author: Thore Thießen, Ingolf Bracht, Munzir Mohamed
 * @creation: 04.12.2014 - sprint-nr: 2
 * @last-change: 15.01.2015 - sprint-nr: 4
 */

var creatingNodeID = null;			// ID der Knoten-Komponente des derzeitig zu erstellenden Projektes
var renameID = null;				// ID des derzeitig umzubenennenden Projektes
var prevName = null;				// Name des derzeitig umzubenennenden Projektes (für etwaiges Zurückbenennen)
var duplicateNodeID = null;			// ID der Knoten-Komponente des derzeitig zu duplizierenden Projektes
var duplicateID = null;				// ID des derzeitig zu duplizierenden Projektes

var selectedNodeID = "";
var prevSelectedNodeID 	= "";


var tree;
var treeInst;

/*
 * Initialisiert den JSTree und die Menü-Einträge.
 */
$(document).ready(function() {
	
	tree = $('.projectswrapper').jstree({"core"    : {"check_callback" : true,"multiple" : false},
										 "plugins" : ["state"]});
	
	/*
	 * Referenziert eine bestehende JSTree-Instanz (ohne eine neue zu erzeugen)
	 * (zu verwenden, um darauf knotenspezifische Methoden anzuwenden)
	 */
	treeInst = $('.projectswrapper').jstree();
	
	
	// Modal zum Bestätigen/Abbrechen des Löschvorgangs
	$('#modal_deleteConfirmation').on('hidden.bs.modal', function(e) {
		// fokussiert den JSTree, um nach Abbruch des Löschvorgangs Tasten-Events behandeln zu können
		tree.focus();
	});
	// 'Ja'-Button des Modals zur Bestätigung des Löschvorgangs
	$('.modal_deleteConfirmation_yes').on("click", function() {
		deleteProject();
	});
	
	
	// ----------------------------------------------------------------------------------------------------
	//                                               LISTENER                                              
	// ----------------------------------------------------------------------------------------------------
	
	// Auswahl-Listener
	tree.bind('select_node.jstree',function(e,data) {
		
		// Deselektion (die der Selection-ID zugehörige Knoten-Komponente wurde erneut selektiert)
		if(selectedNodeID===data.node.id) {
			
			// deselektiert die betroffene Knoten-Komponente
			treeInst.deselect_node(data.node);
			// setzt die Selection-ID zurück
			selectedNodeID = "";
			
		}
		// Selektion (eine Knoten-Komponente werde selektiert, deren ID nicht mit der Selection-ID übereinstimmt)
		else {
			
			// aktualisiert die Selection-ID gemäß der ausgewählten Knoten-Komponente
			selectedNodeID = data.node.id;
			prevSelectedNodeID = data.node.id;
			
		}
		
		// TEST METADATA
		//node = treeInst.get_node(selectedNodeID);
		//console.log("AUTHOR: "+node.author+" ..... CREATETIME: "+node.createtime+" ..... ROOTID: "+node.rootid);
		
		// aktualisiert die Aktivierungen der Menü-Schaltflächen
		updateMenuButtons();
	});
	
	// ----------------------------------------------------------------------------------------------------
	
	// Doppelklick-Listener
	tree.bind("dblclick.jstree",function(e) {
		
		openProject();
		
	});
	
	// ----------------------------------------------------------------------------------------------------
	
	// Tasten-Listener
	tree.bind('keydown',function(e) {
		
		// TEMP
		//console.log(e.keyCode);
		
		// Entf-Taste
		if(e.keyCode===46)
			$('#modal_deleteConfirmation').modal('show');
	});
	
	// ----------------------------------------------------------------------------------------------------
	
	// Umbenennungs-Listener (für 'Erstellen' und 'Umbenennen')
	tree.bind('rename_node.jstree',function(e) {
		
		// blendet das Eingabe-Popover aus
		$('.input_popover').popover('hide');
		
		// wenn die Eingabe des Namens eines neuen Projektes bestätigt wurde (= Erstellen eines Projektes), ...
		if(creatingNodeID!=null) {
			
			// ... und kein Name eingegeben wurde, ...
			if(treeInst.get_text(creatingNodeID)==="") {
				// ... wird der Erstellungs-Vorgang abgebrochen
				treeInst.delete_node(creatingNodeID);
				creatingNodeID = null;
				updateMenuButtons();
			}
			// ... und ein Name eingegeben wurde, ...
			else
				// ... wird severseitig ein neues Projekt mit dem festgelegten Namen erzeugt
				createProject(treeInst.get_text(creatingNodeID));
			}
		// wenn die EIngabe des Names eines zu duplizierenden Projektes bestätigt wurde (= Duplizieren eines Projektes), ...
		else if(duplicateID!=null) {
		
			// ... und kein Name eingegeben wurde, ...
			if(treeInst.get_text(duplicateNodeID)==="") {
				// ... wird der Duplizierungs-Vorgang abgebrochen
				treeInst.delete_node(duplicateNodeID);
				duplicateNodeID = null;
				duplicateID = null;
				updateMenuButtons();
			}
			// ... und ein Name eingegeben wurde, ...
			else
				// ... wird serverseitig das zum duplizieren ausgewählte Projekt mit dem festgelegten Namen dupliziert
				duplicateProject(duplicateID,treeInst.get_text(duplicateNodeID));
		}
		// wenn der neue Name für ein bestehendes Projekt bestätigt wurde (= Umbenennen)
		else if(renameID!=null) {
			
			// ... und kein oder derselbe Name eingegeben wurde, ...
			if(treeInst.get_text(renameID)==="" || treeInst.get_text(renameID)===prevName) {
				// ... wird der Umbenennungs-Vorgang abgebrochen
				//treeInst.set_text(renameID,prevName);
				node = treeInst.get_node(renameID);
				treeInst.set_text(node,getHTML(node));
				renameID = null;
				updateMenuButtons();
			}
			// ... und ein, vom bisherigen Namen verschiedener, Name eingegeben wurde, ...
			else
				// ... wird das serverseitige Umbenennen des betroffenen Projektes eingeleitet
				renameProject(treeInst.get_text(renameID));
		}
		
	});
	
	// ----------------------------------------------------------------------------------------------------
	//                                             MENÜ-EINTRÄGE                                           
	// ----------------------------------------------------------------------------------------------------
	
	// 'Öffnen'-Schaltfläche
	$('.projecttoolbar-open').on("click", function() {
		
		openProject();
		
	});
	
	// 'Erstellen'-Schaltfläche
	$('.projecttoolbar-new').on("click", function() {
		
		// erzeugt eine neue Knoten-Komponente
		creatingNodeID = addNode(null);
		// selektiert die erzeugte Knoten-Komponente
		selectNode(creatingNodeID);
		// versetzt die erzeugte leere Knoten-Komponente in den Bearbeitungsmodus
		editNode(creatingNodeID,"");
		
		// aktualisiert die Aktivierungen der Menü-Schaltflächen (vollständige Deaktivierung)
		updateMenuButtons();
		
		// sobald der Bearbeitungsmodus beendet (s. Umbenennungs-Listener) wird,
		// wird createProject() zum serverseitigen Erstellen eines entsprechenden Projektes aufgerufen
	});
	
	// 'Löschen'-Schaltfläche
	$('.projecttoolbar-delete').on("click", function() {
		
	});
	
	// 'Umbenennen'-Schaltfläche
	$('.projecttoolbar-rename').on("click", function() {
		
		node = treeInst.get_node(selectedNodeID);
		// Projekt-ID des umzubenennenden Projektes
		renameID = node.id;
		// derzeitiger Name des Projektes (für etwaiges Zurückbenennen)
		prevName = node.projectname;
		
		// versetzt die Knoten-Komponente in den Bearbeitungsmodus
		editNode(renameID,node.projectname);
		
		// aktualisiert die Aktivierungen der Menü-Schaltflächen
		updateMenuButtons();
		
		// sobald der Bearbeitungsmodus beendet (s. Umbenennungs-Listener) wird,
		// wird renameProject() zum serverseitigen Umbenennen des betroffenen Projektes aufgerufen
		
	});
	
	// 'Duplizieren'-Schaltfläche
	$('.projecttoolbar-duplicate').on("click", function() {
		
		// Projekt-ID des zu duplizierenden Projektes
		duplicateID = selectedNodeID;
		
		// erzeugt eine neue Knoten-Komponente
		duplicateNodeID = addNode(null);
		// versetzt die erzeugte leere Knoten-Komponente in den Bearbeitungsmodus
		editNode(duplicateNodeID,"");
		
		// aktualisiert die Aktivierungen der Menü-Schaltflächen (vollständige Deaktivierung)
		updateMenuButtons();
		
		// sobald der Bearbeitungsmodus beendet (s. Umbenennungs-Listener) wird,
		// wird duplicateProject() zum serverseitigen Duplizieren eines entsprechenden Projektes aufgerufen		
		
	});
	
	// 'in Vorlage umwandeln'-Schaltfläche
	$('.projecttoolbar-converttotemplate').on("click", function() {
		
		// TODO
		
	});
	
	// 'Export'-Schaltfläche
	$('.projecttoolbar-export').on("click", function() {

		exportZip();
		
	});
	
	// 'Import'-Schaltfläche
	$('.projecttoolbar-import').on("click", function() {
		
		importZip();
		// TODO
		
	});
	
	refreshProjects();
	
});

// ----------------------------------------------------------------------------------------------------
//                                           FUNKTIONALITÄTEN                                          
//                                      (client- und serverseitig)                                     
// ----------------------------------------------------------------------------------------------------

/*
 * Öffnet das momentan ausgewählte Projekt durch Wechseln zu dessen Datei-Übersicht.
 */
function openProject() {
	
	document.location.assign('/dateien/#' + treeInst.get_node(prevSelectedNodeID).rootid);
	
}

/*
 * Erstellt ein neues Projekt mit dem übergebenen Namen.
 *
 * @param name Name für das zu erstellende Projekt
 */
function createProject(name) {
	
	// erzeugt severseitig ein neues Projekt mit dem festgelegten Namen
	documentsJsonRequest({
			'command': 'projectcreate',
			'name': name
		}, function(result,data) {
			// wenn ein entsprechendes Projekt erstellt wurde, ist der Erstellungs-Vorgang abgeschlossen
			if(result) {
				
				// setzt die Erstellungs-ID zurück
				creatingNodeID = null;
				
				// aktualisiert die Anzeige der Projekte
				refreshProjects();
				
				// aktualisiert die Aktivierungen der Menü-Schaltflächen (temporäre vollständige Deaktivierung wird aufgehoben)
				//updateMenuButtons();
			}
			// wenn ein entsprechendes Projekt nicht angelegt werden konnte, ...
			else {
				// ... wird die Knoten-Komponente zur Angabe eines neuen Namens erneut in den Bearbeitungsmodus versetzt (s. Umbenennungs-Listener)
				node = treeInst.get_node(creatingNodeID);
				treeInst.set_text(node,getHTML(node));
				treeInst.edit(creatingNodeID,"");
				
				// TEMP
				alert(data.response);
			}
	});
	
	
}

/*
 * Löscht das momentan ausgewählte Projekt.
 */
function deleteProject() {
	
	documentsJsonRequest({
			'command': 'projectrm',
			'id': selectedNodeID
		}, function(result,data) {
			// wenn das ausgewählte Projekt erfolgreich gelöscht wurde
			if(result) {
				
				// aktualisiert die Anzeige der Projekte
				refreshProjects();
				
				// setzt die Selektions-ID zurück
				selectedNodeID = "";
			}
	});
	
}

/*
 * Benennt das betroffene Projekt nach dem angegebenen Namen um.
 * 
 * @param name neuer Name für das übergebene Projekt
 */
function renameProject(name) {
	
	documentsJsonRequest({
			'command': 'projectrename',
			'id': renameID,
			'name' : name
		}, function(result,data) {
			// wenn das ausgewählte Projekt erfolgreich umbenannt wurde, ist der Umbenennungs-Vorgang abgeschlossen
			if(result) {
				
				// setzt die Umbenennungs-IDs zurück
				renameID = null;
				prevName = null;
				
				// aktualisiert die Anzeige der Projekte
				refreshProjects();
			}
			// wenn das ausgewählte Projekt für den übergebenen Namen nicht umbenannt werden konnte, ...
			else {
				// ... wird die Knoten-Komponente zur Angabe eines neuen Namens erneut in den Bearbeitungsmodus versetzt (s. Umbenennungs-Listener)
				treeInst.edit(renameID,"");
				
				// TEMP
				showPopover(treeInst.get_node(renameID),data.response);
			}
	});
	
}

/*
 * Dupliziert das, der übergebenen ID entsprechende, Projekt unter dem angegebenen Namen.
 *
 * @param projectID ID des zu duplizierenden Projektes
 * @param name Name für das anzulegende Projekt
 */
function duplicateProject(projectID,name) {
	
	// dupliziert severseitig das, der übergebenen ID entsprechende, Projekte unter dem angegebenen Namen
	documentsJsonRequest({
			'command': 'projectclone',
			'id': projectID,
			'name': name
		}, function(result,data) {
			// wenn ein entsprechendes Projekt angelegt wurde, ist der Duplizierungs-Vorgang abgeschlossen
			if(result) {
				
				// setzt die Duplizierungs-IDs zurück
				duplicateNodeID = null;
				duplicateID = null;
				
				// aktualisiert die Anzeige der Projekte
				refreshProjects();
			}
			// wenn ein entsprechendes Projekt nicht angelegt werden konnte, ...
			else {
				// ... wird die Knoten-Komponente zur Angabe eines neuen Namens erneut in den Bearbeitungsmodus versetzt (s. Umbenennungs-Listener)
				treeInst.edit(duplicateNodeID,"");
				
				// TEMP
				alert(data.response);
			}
	});
	
}

/*
 * Exportiert ein Projekt als Zip und bietet diese zum Download an.
 * @param id ID des Projektes
 *
 */
function exportZip() {
    documentsRedirect({
        'command' : 'exportzip',
        'id' : treeInst.get_selected()[0],

    }, function(result,data) {
        if(result) {
            console.log('Export Done!')
            }
        }
    );
}

/*
 *Importieren eines Projektes aus einer ZIP-Datei.
 *
 *
 */

/*
 * Fügt eine neue Knoten-Komponente anhand des übergebenen Projektes hinzu.
 * 
 * @param project Projekt, anhand dessen Daten eine neue Knoten-Komponente hinzugefügt werden soll
 *
 * @return die ID der erzeugten Knoten-Komponente
 */
function addNode(project) {
	
	// fügt eine neue Knoten-Komponente hinzu und füllt die Attribute der Knoten-Komponente mit den Werten des übergebenen Projektes
	return fillNode(treeInst.create_node("#",""),project);
}

/*
 * Versetzt die, der übergebenen ID entsprechende, Knoten-Komponente in den Bearbeitungsmodus.
 *
 * @param nodeID ID der Knoten-Komponente, deren Name bearbeitet werden soll
 * @param text Text-Vorgabe zur Editierung
 */
function editNode(nodeID,text) {
	
	// zeigt das Eingabe-Popover in relativer Position zur betroffenen Knoten-Komponente an
	showPopover(treeInst.get_node(nodeID));
	// versetzt die betroffene Knoten-Komponente in den Bearbeitungsmodus
	treeInst.edit(nodeID,text);
}

/*
 * Füllt die Attribute der übergebenen Knoten-Komponente mit den Werten des angegebenen Projektes.
 * 
 * @param nodeID ID der Knoten-Komponente, deren Attribute gemäß des angegebenen Projektes gesetzt werden sollen
 * @param project Projekt, anhand dessen Daten die Attribute der übergebenen Knoten-Komponente gesetzt werden sollen
 *
 * @return die ID der Knoten-Komponente
 */
function fillNode(nodeID,project) {
	
	node = treeInst.get_node(nodeID);
	
	if(project!=null) {
		
		// setzt die ID der Knoten-Komponente auf die des übergebenen Projektes
		treeInst.set_id(node,project.id);
		
		// setzt die weiteren Attribute des Projektes
		node.projectname 		= project.name;
		node.author 			= project.ownername;
		node.createtime 		= project.createtime;
		node.rootid 			= project.rootid;
		
	}
	
	// setzt die Bezeichnung der Knoten-Komponente anhand der Daten des übergebenen Projektes
	treeInst.set_text(node,getHTML(node));
	
	return node.id;
}

/*
 * Liefert die html-Repräsentation der übergebenen Knoten-Komponente.
 *
 * @param node Knoten-Komponente, deren zugehörige html-Repräsentation zurückgegeben werden soll
 *
 * @return die html-Repräsentation der übergebenen Knoten-Komponente
 */
function getHTML(node) {
	
	var relTime = getRelativeTime(node.createtime);
	
	return  "<div class=\"node_item\">"+
				"<li class=\"node_item_"+node.id+"\">"+
					"<span class=\"projectitem-name\">"+node.projectname+"</span>"+
					"<span class=\"projectitem-createdate\" title=\"erstellt "+relTime+"\">"+relTime+"</span>"+
		    		"<span class=\"projectitem-author\">"+node.author+"</span>"+
		    	"</li>"+
		    "</div>";
}

/*
 * Aktualisiert die Anzeige der Projekte des Benutzers.
 */
function refreshProjects() {
	
	// leert den JSTrees
	treeInst.settings.core.data = null;
	treeInst.refresh();
	
	// aktualisiert den JSTree anhand der bestehenden Projekte
	documentsJsonRequest({
		'command': 'listprojects'
		}, function(result,data) {
			if(result) {
				// legt für jedes Projekt eine Knoten-Komponente an
				for(var i=0; i<data.response.length; ++i)
					addNode(data.response[i]);
			}
	});
	
	// aktualisiert die Aktivierungen der Menü-Schaltflächen
	updateMenuButtons();
}

/*
 * Selektiert die, der übergebenen ID entsprechende, Knoten-Komponente.
 * Hierbei wird die momentan ausgewählte Knoten-Komponente deselektiert.
 *
 * @param nodeID ID der Knoten-Komponente, welche selektiert werden soll
 */
function selectNode(nodeID) {
	
	treeInst.deselect_node(treeInst.get_selected());
	treeInst.select_node(nodeID);
	selectedNodeID = nodeID;
}

/*
 * Zeigt das Popover in relativer Position zur übergebenen Knoten-Komponente an.
 *
 * @param node Knoten-Komponente zu deren Position das Popover relativ angezeigt werden soll
 * @param error Fehlermeldung, welche durch das Popover dargestellt werden soll
 */
function showPopover(node,error) {
	
	if(node!=null) {
		
		// Position der übergebenen Knoten-Komponente	
		var pos = $('.node_item_'+node.id).position();
		var height = $('.node_item_'+node.id).height();
		
		var popover = $('.input_popover');
		if(error) {
			popover = $('.error_popover');
			popover.popover({content: error});
		}
		
		// zeigt das Popover an und richtet es links über der Knoten-Komponente aus
		// (Reihenfolge nicht verändern!)
		popover.popover('show');
        $('.popover').css('left',pos.left+'px');
        $('.popover').css('top',(pos.top-height*2+5)+'px');
        
	}
}

/*
 * Aktualisiert die Aktivierungen der Menü-Schaltflächen.
 */
function updateMenuButtons() {
	
	// flag für die Aktivierung der nicht-selektionsabhängigen Schaltflächen ('Erstellen' und 'Import')
	var basic;
	// flag für die Aktivierung der selektionsabhängigen Schaltflächen
	var remain;
	
	// Editierungsmodus
	if(creatingNodeID!=null || renameID!=null || duplicateID!=null) {
		// keine Aktivierungen
		basic  = false;
		remain = false;
	}
	// Selektion
	else if(treeInst.get_selected().length!=0) {
		// vollständig Aktivierung
		basic  = true;
		remain = true;
	}
	else {
		// Aktivierung der nicht-selektionsabhängigen Schaltflächen
		basic  = true;
		remain = false;
	}
	
	// setzt die Aktivierungen der einzelnen Menü-Schaltflächen
	$('.projecttoolbar-open').prop("disabled", !remain);
	$('.projecttoolbar-new').prop("disabled", !basic);
	$('.projecttoolbar-delete').prop("disabled", !remain);
	$('.projecttoolbar-rename').prop("disabled", !remain);
	$('.projecttoolbar-duplicate').prop("disabled", !remain);
	$('.projecttoolbar-converttotemplate').prop("disabled", !remain);
	$('.projecttoolbar-export').prop("disabled", !remain);
	$('.projecttoolbar-import').prop("disabled", !basic);
}