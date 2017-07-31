/**
 * de.sb.messenger.PeopleController: messenger people controller.
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
        };
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

            var indebtedSemaphore = new de_sb_util.Semaphore(1 - 2);
            var self = this;
            var header = {"Accept": "application/json"};

            if (!sessionUser.observedReferences) {
                sessionUser.observedReferences = [];
                var resource = "/services/people/" + sessionUser.identity + "/peopleObserved";
                de_sb_util.AJAX.invoke(resource, "GET", header, null, null, function (request) {
                    if (request.status === 200) {
                        var people = JSON.parse(request.responseText);
                        people.forEach(function (person) {
                            self.entityCache.put(person);
                            sessionUser.observedReferences.push(person.identity);
                        });
                    }
                    indebtedSemaphore.release();
                });
            } else {
                indebtedSemaphore.release();
            }


            if (!sessionUser.observingReferences) {
                sessionUser.observingReferences = [];
                resource = "/services/people/" + sessionUser.identity + "/peopleObserving";
                de_sb_util.AJAX.invoke(resource, "GET", header, null, null, function (request) {
                    if (request.status === 200) {
                        var people = JSON.parse(request.responseText);
                        people.forEach(function (person) {
                            self.entityCache.put(person);
                            sessionUser.observingReferences.push(person.identity);
                        });
                    }
                    indebtedSemaphore.release();
                });
            } else {
                indebtedSemaphore.release();
            }

            indebtedSemaphore.acquire(function () {
                var mainElement = document.querySelector("main");
                var sectionElement = document.querySelector("#people-observing-template").content.cloneNode(true).firstElementChild;
                self.refreshAvatarSlider(sectionElement.querySelector("div.image-slider"), sessionUser.observingReferences, self.toggleObservation);
                mainElement.appendChild(sectionElement);

                sectionElement = document.querySelector("#people-observed-template").content.cloneNode(true).firstElementChild;
                self.refreshAvatarSlider(sectionElement.querySelector("div.image-slider"), sessionUser.observedReferences, self.toggleObservation);
                mainElement.appendChild(sectionElement);

                sectionElement = document.querySelector("#candidates-template").content.cloneNode(true).firstElementChild;
                sectionElement.querySelector("button").addEventListener("click", self.query.bind(self));
                mainElement.appendChild(sectionElement);
            });
        };

        /**
         * Performs a REST based criteria query, and refreshes the people
         * view's bottom avatar slider with the result.
         */
        de_sb_messenger.PeopleController.prototype.query = function () {
            var section = document.querySelector("section.candidates");
            var inputElements = document.querySelectorAll("section.candidates input");
            var imageSlider = section.querySelector("div.image-slider");
            var self = this;
            var url = "/services/people";
            if (inputElements[0].value) {
                url = url + "?email=" + inputElements[0].value.trim();
            }
            if (inputElements[1].value) {
                url = url + "?givenName=" + inputElements[1].value.trim();
            }
            if (inputElements[2].value) {
                url = url + "?familyName=" + inputElements[2].value.trim();
            }
            if (inputElements[3].value) {
                url = url + "?street=" + inputElements[3].value.trim();
            }
            if (inputElements[4].value) {
                url = url + "?city=" + inputElements[4].value.trim();
            }
            var header = {"Accept": "application/json"};
            de_sb_util.AJAX.invoke(url, "GET", header, null, null, function (request) {
                SUPER.prototype.displayStatus(request.status, request.statusText);
                if (request.status === 200) {
                    var ids = [];
                    var people = JSON.parse(request.responseText);
                    people.forEach(function (person) {
                        ids.push(person.identity);
                    });
                    self.refreshAvatarSlider(imageSlider, ids, self.toggleObservation);
                }
            });
        };

        /**
         * Updates the user's observed people with the given person. Removes the
         * person if it is already observed by the user, or adds it if not.
         * @param {String} personIdentity the identity of the person to add or remove
         */
        de_sb_messenger.PeopleController.prototype.toggleObservation = function (personIdentity) {
            var sessionUser = de_sb_messenger.APPLICATION.sessionUser;
            var self = this;
            var observed = [];

            if (self.contains(sessionUser.observedReferences, personIdentity)) {
                sessionUser.observedReferences.forEach(function (item) {
                    if (item !== personIdentity) {
                        observed.push(item);
                    }
                });
                sessionUser.observedReferences = observed;
                console.log("remove");
            } else {
                sessionUser.observedReferences.push(personIdentity);
                console.log("add");
            }

            var mainElement = document.querySelector("main");
            var sectionElement = document.querySelector("#people-observed-template").content.cloneNode(true).firstElementChild;
            self.refreshAvatarSlider(sectionElement.querySelector("div.image-slider"), sessionUser.observedReferences, self.toggleObservation);
            var oldElement = mainElement.firstElementChild.nextElementSibling;
            mainElement.replaceChild(sectionElement, oldElement);

            var references = JSON.stringify(sessionUser.observedReferences);
            var header = {"Content-type": "application/json"};
            var url = "/services/people/" + sessionUser.identity + "/peopleObserved";
            de_sb_util.AJAX.invoke(url, "PUT", header, references, null, function (request) {
                SUPER.prototype.displayStatus(request.status, request.statusText);
                if (request.status === 200) {
                    
                }
            });
        };

        de_sb_messenger.PeopleController.prototype.contains = function (myArray, myValue) {
            var inArray = false;
            myArray.map(function (key) {
                if (key === myValue) {
                    inArray = true;
                }
            });
            return inArray;
        };
    }()
);