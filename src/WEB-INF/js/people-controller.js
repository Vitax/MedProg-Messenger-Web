/**
 * de_sb_messenger.PeopleController: messenger people controller.
 * Copyright (c) 2013 Sascha Baumeister
 */
"use strict";

this.de_sb_messenger = this.de_sb_messenger || {};
(function () {
	var SUPER = de_sb_messenger.Controller;

	/**
	 * Creates a new people controller that is derived from an abstract controller.
	 * @param sessionContext {de_sb_messenger.ajax.SessionContext} a session context
	 * @param entityCache {de_sb_messenger.EntityCache} an entity cache
	 */
	de_sb_messenger.PeopleController = function (entityCache) {
		SUPER.call(this, 2, entityCache);
	}
	de_sb_messenger.PeopleController.prototype = Object.create(SUPER.prototype);
	de_sb_messenger.PeopleController.prototype.constructor = de_sb_messenger.PeopleController;


	/**
	 * Displays the associated view.
	 */
	de_sb_messenger.PeopleController.prototype.display = function () {
		var sessionUser = de_sb_messenger.APPLICATION.sessionUser;
		if (!sessionUser) return;
		
		SUPER.prototype.display.call(this);
		this.displayStatus(200, "OK");
		
		if(!sessionUser.observingReferences && !sessionUser.observedReferences) {
			sessionUser.observingReferences = [];
			sessionUser.observedReferences = [];
		}

		var self = this;
		var header = {"Accept": "application/json"};

		var indebtedSemaphore = new de_sb_util.Semaphore(1 - 2);
		var statusAccumulator = new de_sb_util.StatusAccumulator();
		

		if(!sessionUser.peopleObserved) {
			var resource = "/services/people/" + sessionUser.identity + "/peopleObserved";
			de_sb_util.AJAX.invoke(resource, "GET", header, null, null, function (request) {
				if (request.status === 200) {
					var people = JSON.parse(request.responseText);
					people.forEach(function (person) {
						self.entityCache.put(person);
						sessionUser.observedReferences.push(person.identity);
					});
				}
				statusAccumulator.offer(request.status, request.statusText);
			});
		} 

		if(!sessionUser.peopleObserving) {
			resource = "/services/people/" + sessionUser.identity + "/peopleObserving";
				de_sb_util.AJAX.invoke(resource, "GET", header, null, null, function (request) {
	
				if (request.status === 200) {
					var people = JSON.parse(request.responseText);
					people.forEach(function (person) {
						self.entityCache.put(person);
						sessionUser.observingReferences.push(person.identity);
					});
				}
				statusAccumulator.offer(request.status, request.statusText);
			});
		}

		indebtedSemaphore.acquire(function () {
			self.displayStatus(statusAccumulator.status, statusAccumulator.statusText);
			de_sb_messenger.APPLICATION.preferencesController.display();
		});

		var mainElement = document.querySelector("main");
		var sectionElement = document.querySelector("#people-observing-template").content.cloneNode(true).firstElementChild;
		this.refreshAvatarSlider(sectionElement.querySelector("div.image-slider"), sessionUser.observingReferences, this.toggleObservation);
		mainElement.appendChild(sectionElement);

		sectionElement = document.querySelector("#people-observed-template").content.cloneNode(true).firstElementChild;
		this.refreshAvatarSlider(sectionElement.querySelector("div.image-slider"), sessionUser.observedReferences, this.toggleObservation);
		mainElement.appendChild(sectionElement);

		sectionElement = document.querySelector("#candidates-template").content.cloneNode(true).firstElementChild;
		sectionElement.querySelector("button").addEventListener("click", this.query.bind(this));
		mainElement.appendChild(sectionElement);
	}


	/**
	 * Performs a REST based criteria query, and refreshes the people
	 * view's bottom avatar slider with the result.
	 */
	de_sb_messenger.PeopleController.prototype.query = function () {
		var sectionElement = document.querySelector("section.candidates login");
	
	}


	/**
	 * Updates the user's observed people with the given person. Removes the
	 * person if it is already observed by the user, or adds it if not.
	 * @param {String} personIdentity the identity of the person to add or remove
	 */
	de_sb_messenger.PeopleController.prototype.toggleObservation = function (personIdentity) {
		// TODO
	}
} ());
