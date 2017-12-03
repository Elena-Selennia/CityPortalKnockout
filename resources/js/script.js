ko.validation.init({ insertMessages: false }, true);

function makeCounter() {
    var currentCount = 0;
    return function () {
        return currentCount++;
    };
}

var cityCounter = makeCounter();
var areaCounter = makeCounter();

var City = function (data) {
    var self = this;
    self.id = ko.observable();
    self.name = ko.observable().extend({
        required: { params: true, message: 'City name is required.' },
        maxLength: {
            message: 'The text entered exceeds the maximum length.',
            params: 20
        },
        trackPropertyChange: true
    });
    self.isPolluted = ko.observable().extend({ trackPropertyChange: true });
    self.isCriminal = ko.observable().extend({ trackPropertyChange: true });
    self.isIndustrial = ko.observable().extend({ trackPropertyChange: true });
    self.cityAreas = ko.observableArray().extend({ trackPropertyChange: true });
    self.hrefAttr = ko.observable();

    self.update(data);

    self.cityAreasNames = ko.computed(function () {
        var cityAreasNamesText = '';
        if (self.cityAreas().length) {
            var cityAreasNamesArray = [];
            self.cityAreas().forEach(function (item, i, arr) {
                cityAreasNamesArray.push(item.name());
            });
            cityAreasNamesText = cityAreasNamesArray.join(', ');
        } else {
            cityAreasNamesText = 'No areas';
        }
        return cityAreasNamesText;
    });
};

var Area = function (data) {
    var self = this;
    self.id = ko.observable();
    self.name = ko.observable().extend({
        required: { params: true, message: 'City name is required.' },
        maxLength: {
            message: 'The text entered exceeds the maximum length.',
            params: 20
        },
        trackPropertyChange: true
    });
    self.description = ko.observable().extend({ trackPropertyChange: true });
    self.citizens = ko.observable().extend({ trackPropertyChange: true });

    self.update(data);
};

City.prototype.update = function (data) {
    this.id(data.id || 'city' + cityCounter());
    this.name(data.name || 'New City');
    this.isPolluted(data.isPolluted || false);
    this.isCriminal(data.isCriminal || false);
    this.isIndustrial(data.isIndustrial !== undefined ? data.isIndustrial : true);

    if (data.cityAreas) {
        this.cityAreas(ko.utils.arrayMap(data.cityAreas,
            function (area) {
                return new Area(area);
            }));
    } else {
        this.cityAreas(data.cityAreas || []);
    }

    this.hrefAttr('#' + this.id());
};

Area.prototype.update = function (data) {
    this.id(data.id || 'area' + areaCounter());
    this.name(data.name || 'New area');
    this.description(data.description || 'Area description');
    this.citizens(data.citizens || 0);
};

var ViewModel = function (defaultValue) {
    var self = this;
    self.cities = ko.observableArray();

    fillCitiesFromStorage(self.cities, defaultValue);

    self.cities.extend({ trackPropertyChange: true })

    self.toggleButtons = function (prop, data) {
        prop(!prop());
    }

    self.deleteCity = function (city) {
        var del_confirm = confirm('Do you want to delete this city?');
        if (del_confirm) {
            self.cities.remove(this);
        }
    }

    self.deleteArea = function (city, area) {
        var del_confirm = confirm('Do you want to delete this area?');
        if (del_confirm) {
            city.cityAreas.remove(area);
        }
    }

    self.selectedItem = ko.observable();
    self.cityForEditing = ko.observable();
    self.areaForEditing = ko.observable();

    self.selectCity = self.selectCity.bind(self);
    self.selectArea = self.selectArea.bind(self);
    self.addCity = self.addCity.bind(self);
    self.addArea = self.addArea.bind(self);
    self.acceptCity = self.acceptCity.bind(self);
    self.acceptArea = self.acceptArea.bind(self);
    self.revertItem = self.revertItem.bind(self);
};

ko.utils.extend(ViewModel.prototype,
    {
        selectCity: function (city) {
            this.selectedItem(city);
            this.cityForEditing(new City(ko.toJS(city)));

            var cityPopup = getEditPopup('edit_city', true);
            cityPopup.querySelector('.edit_title h4').innerHTML = 'Edit City';
            clickOutside(cityPopup);
        },

        selectArea: function (area) {
            this.selectedItem(area);
            this.areaForEditing(new Area(ko.toJS(area)));

            var cityPopup = getEditPopup('edit_area', true);
            cityPopup.querySelector('.edit_title h4').innerHTML = 'Edit Area';
            clickOutside(cityPopup);
        },

        addCity: function () {
            this.cityForEditing(new City({}));
            this.selectedItem(null);

            var cityPopup = getEditPopup('edit_city', true);
            cityPopup.querySelector('.edit_title h4').innerHTML = 'Add New City';
            clickOutside(cityPopup);
        },

        addArea: function (city) {
            this.areaForEditing(new Area({}));
            this.selectedItem(city);

            var areaPopup = getEditPopup('edit_area', true);
            areaPopup.querySelector('.edit_title h4').innerHTML = 'Add New Area';
            clickOutside(areaPopup);
        },

        acceptCity: function () {
            var selected = this.selectedItem();
            var edited = ko.toJS(this.cityForEditing());

            if (this.cityForEditing().name.isValid()) {

                if (selected) {
                    selected.update(edited);
                } else {
                    this.cities.push(this.cityForEditing());
                }

                this.selectedItem(null);
                this.cityForEditing(null);
                getEditPopup('edit_city');
            } else {
                alert(this.cityForEditing().name.error())
            }
        },

        acceptArea: function () {
            var selected = this.selectedItem();
            var edited = ko.toJS(this.areaForEditing());

            if (this.areaForEditing().name.isValid()) {

                if (selected instanceof Area) {
                    selected.update(edited);
                } else if (selected instanceof City) {
                    selected.cityAreas.push(this.areaForEditing());
                }

                this.selectedItem(null);
                this.areaForEditing(null);
                getEditPopup('edit_area');
            } else {
                alert(this.areaForEditing().name.error())
            }
        },

        revertItem: function () {
            this.selectedItem(null);
            this.cityForEditing(null);
            this.areaForEditing(null);
            getEditPopup('edit_city');
            getEditPopup('edit_area');
        }
    });

ko.extenders.trackPropertyChange = function (target, value) {
    target.subscribe(function () {
        if (viewModel) {
            try {
                localStorage.setItem('cityArray', ko.toJSON(viewModel.cities()));
            } catch (e) {
            }
        }
    });
    return target;
};

var viewModel = new ViewModel([
    {
        name: 'Cheese', isPolluted: true, isCriminal: false, isIndustrial: true, cityAreas: [
            { name: 'Cheese1', description: 'fdfdf', citizens: 10 },
            { name: 'Cheese3', description: 'fdfdfdfd', citizens: 10 }]
    }
]);

ko.applyBindings(viewModel);

function clickOutside(popup) {
    var doc = document;
    doc.onclick = function (event) {
        var isClickInside = popup.contains(event.target);
        if (!isClickInside) {
            popup.style.display = 'none';							
        }
    }
}

function getEditPopup(id, isVisible = false) {
    var popup = document.getElementById(id);

    if (popup) {
        if (isVisible) {
            popup.style.display = 'block';
        } else {
            popup.style.display = 'none';
        }
    }
    return popup;
}

function mapCityArray(array) {
    var observableCityArray = ko.utils.arrayMap(array, function (data) { return new City(data); });
    return observableCityArray;
}

function fillCitiesFromStorage(cities, defaultValue) {
    if (localStorage.getItem('cityArray')) {
        try {
            var storageValue = JSON.parse(localStorage.getItem('cityArray'));
            cities(mapCityArray(storageValue));
        } catch (e) {
        }
    }

    if (!cities().length) {
        cities(mapCityArray(defaultValue));
    }
}