var playground = function(){
    
    var properties = {};
    var staging = [];

    var _playground = function(root, stepName) {
        this.root = root;
        this.stepName = stepName;
    };

    _playground.prototype = {
        /**
         * 
         * @param {String} key - the name of the property
         * @param {String} value - the value of the property
         * @param {String} source - 'inject', 'propFile', 'envVar', 'sysProp'
         * @param {*} ordinal (optional) - provided ordinal number. otherwise default based on source
         */
        playgroundAddConfig: function(key, value, source, ordinal) {
            if (!ordinal) {
                ordinal = this.__getDefaultOrdinal(source);
            }

            if (properties[key]) {
                var oldOrdinal = properties[key].ordinal;
                if (parseInt(ordinal) >= parseInt(oldOrdinal)) {
                    properties[key] = {'ordinal': ordinal, 'value': value};
                }
            } else {
                properties[key] = {'ordinal': ordinal, 'value': value};
            }
        },

        repopulatePlaygroundConfigs: function() {
            properties = {};

            this.__getInjectionProperties();
            this.__getPropertiesFileProperties();
            this.__getEnvironmentProperties();
            this.__getSystemProperties();
            this.showProperties();
        },

        __getInjectionProperties: function() {
            var injectionContent = contentManager.getTabbedEditorContents('DefaultPlayground', 'CarTypes.java');

            // Use regex global search to find and store all indices of matches.
            // Makes sure we have @Inject and @ConfigProperty
            var regexp = /\@Inject\s*\@ConfigProperty/g;
            var match, matches = [];
            while ((match = regexp.exec(injectionContent)) != null) {
                matches.push(match.index);
            }
            
            // For each match, grab string until end of Java code line (including lines split for readability).
            var lines = [];
            for (var i in matches) {
                var content = injectionContent.substring(matches[i]);
                var endLine = content.indexOf(";");
                var line = content.substring(0, endLine);
                lines.push(line);
            }

            // For each line, grab config value and properties
            for (var i in lines) {
                var lineRegexp = /(?<=\().*(?=\))/gs;  //grab everything in between the parentheses
                var propertyLine = lineRegexp.exec(lines[i]);

                if (propertyLine) {
                    var inlineProperties = propertyLine[0];
                    var nameRegexp = /name="(.*?)"/g; //match 'name' property, with the property value as substring match
                    var defaultValueRegexp = /defaultValue="(.*?)"/g; //match 'defaultValue' property, with the property value as substring match
                    var name = nameRegexp.exec(inlineProperties);
                    var defaultValue = defaultValueRegexp.exec(inlineProperties);
                    if (name && defaultValue) {
                        //index 1 is the regex substring match which contains the value of the match
                        this.playgroundAddConfig(name[1], defaultValue[1], 'inject'); 
                    }
                }
            }
        },

        __getPropertiesFileProperties: function() {
            this.__parseAndStorePropertyFiles('/META-INF/microprofile-config.properties', 'propFile');
        },

        __getEnvironmentProperties: function() {
            this.__parseAndStorePropertyFiles('server.env', 'envVar');
        },

        __getSystemProperties: function() {
            this.__parseAndStorePropertyFiles('bootstrap.properties', 'sysProp');
        },

        __parseAndStorePropertyFiles: function(filename, filetype) {
            var fileContent = contentManager.getTabbedEditorContents('DefaultPlayground', filename);
            
            if (fileContent) {
                var regex = /(^.*?)=(.*$)/gm;
                var match = null;
                var ordinal;
                while ((match = regex.exec(fileContent)) !== null) {
                    var key = match[1];
                    var value = match[2];
                    if (key === "config_ordinal") {
                        //TODO: what if ordinal has already been set? (multiple config_ordinal keys)
                        ordinal = value;
                    } else {
                        this.__stageConfigProperty(key, value);                        
                    }
                }

                this.__storeStagedProperties(filetype, ordinal);
            }
        },
        
        __stageConfigProperty: function(key, value) {
            staging.push([key, value]);
        },

        __storeStagedProperties: function(source, ordinal) {
            for (var i in staging) {
                var key = staging[i][0];
                var value = staging[i][1];
                if (this.getProperty(key) !== null) {
                    this.playgroundAddConfig(key, value, source, ordinal);                    
                } else {
                    //TODO: editor error message for this
                    console.log("This property needs to be set with @Inject in Java file");
                }
            }
            staging = [];
        },

        showProperties: function() {
            var props = this.getProperties();
            var propsDiv = this.root.find('.properties');
            propsDiv.empty();
            for (var key in props) {
                var prop = $('<li>');
                prop.html(key + " - " + props[key].value);
                propsDiv.append(prop);
            }
        },

        __getDefaultOrdinal: function(source) {
            switch(source) {
            case 'inject': return '0';
            case 'propFile': return '100';
            case 'envVar': return '300';
            case 'sysProp': return '400';
            default: return '0';
            }
        },

        getProperties: function() {
            return properties;
        },
        
        getProperty: function(key) {
            if (properties[key]) {
                return properties[key];
            } else {
                return null;
            }
        }
    };

    var _create = function(root, stepName){
        return new _playground(root, stepName);
    };

    return {
        create: _create
    };
}();
