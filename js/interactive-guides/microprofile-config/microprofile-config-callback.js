/*******************************************************************************
* Copyright (c) 2017 IBM Corporation and others.
* All rights reserved. This program and the accompanying materials
* are made available under the terms of the Eclipse Public License v1.0
* which accompanies this distribution, and is available at
* http://www.eclipse.org/legal/epl-v10.html
*
* Contributors:
*     IBM Corporation - initial API and implementation
*******************************************************************************/
var microprofileConfigCallBack = (function() {

    var propsFileConfig = "download-url=ftp://music.com/canada/download";
    var __checkConfigPropsFile = function(content) {
        var match = false;
        try {
            if(content.match(/\s*download-url=ftp:\/\/music.com\/canada\/download\s*/g)){
                match = true;
            }
        }
        catch (e) {

        }
        return match;
    };

    /*
     * Callback and functions to support Configuring as an Environment Variable step.
     */
    var serverEnvDownloadUrlConfig = "download-url=ftp://music.com/asia/download";
    var __checkServerEnvContent = function(content) {
        var match = false;
        try {
            if (content.match(/WLP_SKIP_MAXPERMSIZE=true\s*download-url=ftp:\/\/music.com\/asia\/download\s*/g)) {
                match = true;
            }
        }
        catch (e) {

        }
        return match;
    };

    var __listenToEditorForPropConfig = function(editor) {
        var __showWebBrowser = function() {
            var stepName = editor.getStepName();
            var content = contentManager.getEditorContents(stepName);
            if (__checkConfigPropsFile(content)) {
                editor.closeEditorErrorBox(stepName);
                contentManager.showBrowser(stepName, 0);
                contentManager.addRightSlideClassToBrowser(stepName, 0);
                var index = contentManager.getCurrentInstructionIndex();
                if(index === 0){
                    contentManager.markCurrentInstructionComplete(stepName);
                    contentManager.updateWithNewInstructionNoMarkComplete(stepName);
                }
            } else {
                // display error and provide link to fix it
                editor.createErrorLinkForCallBack(stepName, true, __addPropToConfigProps);
            }
        };
        editor.addSaveListener(__showWebBrowser);
    };

    var __listenToEditorForServerEnv = function(editor) {
        var __showWebBrowser = function() {
            var stepName = editor.getStepName();
            var content = contentManager.getEditorContents(stepName);
            if (__checkServerEnvContent(content)) {
                editor.closeEditorErrorBox(stepName);
                contentManager.showBrowser(stepName, 0);
                contentManager.addRightSlideClassToBrowser(stepName, 0);

                var index = contentManager.getCurrentInstructionIndex();
                if(index === 0){
                    contentManager.markCurrentInstructionComplete(stepName);
                    contentManager.updateWithNewInstructionNoMarkComplete(stepName);
                }
            } else {
                // display error and provide link to fix it
                editor.createErrorLinkForCallBack(stepName, true, __addPropToServerEnv);
            }
        };
        editor.addSaveListener(__showWebBrowser);
    };

    var __addPropToConfigProps = function() {
        var stepName = stepContent.getCurrentStepName();
        // reset content every time property is added through the button so as to clear out any manual editing
        contentManager.resetEditorContents(stepName);
        var content = contentManager.getEditorContents(stepName);

        contentManager.replaceEditorContents(stepName, 1, 1, propsFileConfig);
    };

    var __addPropToServerEnv = function() {
        var stepName = stepContent.getCurrentStepName();
        // reset content every time property is added through the button so as to clear out any manual editing
        contentManager.resetEditorContents(stepName);
        var content = contentManager.getEditorContents(stepName);

        contentManager.replaceEditorContents(stepName, 2, 2, serverEnvDownloadUrlConfig);
        var readOnlyLines = [];
        readOnlyLines.push({
            from: 1,
            to: 1
        });
        contentManager.markEditorReadOnlyLines(stepName, readOnlyLines);
    };

    var __listenToBrowserForPropFileConfig = function(webBrowser) {
        var setBrowserContent = function(currentURL) {
            webBrowser.setBrowserContent("/guides/iguide-microprofile-config/html/interactive-guides/microprofile-config/download-from-properties-file.html");
            contentManager.markCurrentInstructionComplete(webBrowser.getStepName());
        }
        // Cannot use contentManager.hideBrowser as the browser is still going thru initialization
        webBrowser.contentRootElement.addClass("hidden");
        webBrowser.addUpdatedURLListener(setBrowserContent);
    };

    var __listenToBrowserForServerEnvConfig = function(webBrowser) {
        var setBrowserContent = function(currentURL) {
            webBrowser.setBrowserContent("/guides/iguide-microprofile-config/html/interactive-guides/microprofile-config/download-from-property-in-server-env.html");
            contentManager.markCurrentInstructionComplete(webBrowser.getStepName());
        }
        // Cannot use contentManager.hideBrowser as the browser is still going thru initialization
        webBrowser.contentRootElement.addClass("hidden");
        webBrowser.addUpdatedURLListener(setBrowserContent);
    };

    var __addPropToServerEnvButton = function(event) {
        if (event.type === "click" ||
           (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
            // Click or 'Enter' or 'Space' key event...
            __addPropToServerEnv();
        }
    };

    var __refreshBrowserButton = function(event) {
        if (event.type === "click" ||
           (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
           // Click or 'Enter' or 'Space' key event...
           contentManager.refreshBrowser(stepContent.getCurrentStepName());
        }
    };

    var __saveButton = function(event) {
        if (event.type === "click" ||
           (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
            // Click or 'Enter' or 'Space' key event...
            contentManager.saveEditor(stepContent.getCurrentStepName());
        }
    };

    var __getInjectionConfigContent = function(content) {
        var annotationParams = null;
        try {
            // match
            // private Config config;
            //   <space or newline here>
            // @Inject @ConfigProperty(name=\"download-url\", defaultValue=\"ftp://music.com/us/download\")
            // private String downloadUrl;
            var contentToMatch = "[\\s\\S]*private Config config;\\s*@Inject\\s*@ConfigProperty\\s*\\(([\\s\\S]*)\\)\\s*private String downloadUrl;";
            var regExpToMatch = new RegExp(contentToMatch, "g");
            var groups = regExpToMatch.exec(content);

            var params = groups[1];
            params = params.replace('\n','');
            params = params.replace(/\s/g, ''); // Remove whitespace
            if (params.trim() !== "") {
                params = params.split(',');
            } else {
                params = [];
            }
            annotationParams = params;
        }
        catch (e) {

        }
        return annotationParams;
    };

    var __isParamInAnnotation = function(annotationParams) {
        var allMatch = false;
        if (annotationParams.length === 2) {
            var param1 = annotationParams[0];
            var param2 = annotationParams[1];

            if ((param1 === "name=\"download-url\"" &&
                 param2 === "defaultValue=\"ftp:\/\/music.com\/us\/download\"") ||
                (param2 === "name=\"download-url\"" &&
                 param1 === "defaultValue=\"ftp:\/\/music.com\/us\/download\"")) {
                allMatch = true;
            }
        }
        return allMatch;
    }

    var __checkInjectionEditorContent = function(content) {
        var annotationIsThere = false;
        var editorContentBreakdown = __getInjectionConfigContent(content);
        if (editorContentBreakdown !== null) {
            annotationIsThere = __isParamInAnnotation(editorContentBreakdown);
        }
        return annotationIsThere;
    };

    var __saveServerXML = function() {
      var stepName = stepContent.getCurrentStepName();
      var content = contentManager.getEditorContents(stepName);
      if (__checkMicroProfileConfigFeatureContent(content)) {
          var stepName = stepContent.getCurrentStepName();
          contentManager.markCurrentInstructionComplete(stepName);
      } else {
          // display error to fix it
          __createErrorLinkForCallBack(stepName, true);
      }
    };

    var __listenToEditorForFeatureInServerXML = function(editor) {
      var saveServerXML = function() {
          __saveServerXML();
      };
      editor.addSaveListener(saveServerXML);
    };

    var __saveServerXMLButton = function(event) {
      if (event.type === "click" ||
         (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
          // Click or 'Enter' or 'Space' key event...
          __saveServerXML();
      }
    };

    var __listenToEditorForInjectConfig = function(editor) {
        var __showWebBrowser = function() {
            var stepName = editor.getStepName();
            var content = contentManager.getEditorContents(stepName);
            if (__checkInjectionEditorContent(content)) {
                editor.closeEditorErrorBox(stepName);
                //contentManager.showBrowser(stepName, 0);
                //contentManager.addRightSlideClassToBrowser(stepName, 0);
                contentManager.markCurrentInstructionComplete(stepName);
                //contentManager.updateWithNewInstructionNoMarkComplete(stepName);
            } else {
                // display error and provide link to fix it
                editor.createErrorLinkForCallBack(stepName, true, __addInjectConfigToEditor);
            }
        };
        editor.addSaveListener(__showWebBrowser);
    };

    var __getMicroProfileConfigFeatureContent = function(content) {
      var editorContents = {};
      try {
          // match
          // <feature>jaxrs-2.0</feature>
          //    <anything here>
          // </featureManager>
          // and capturing groups to get content before <feature>jaxrs-2.0</feature>, the feature, and after
          // closing featureManager content tag.
          var featureManagerToMatch = "([\\s\\S]*)<feature>jaxrs-2.0</feature>([\\s\\S]*)<\\/featureManager>([\\s\\S]*)";
          var regExpToMatch = new RegExp(featureManagerToMatch, "g");
          var groups = regExpToMatch.exec(content);
          editorContents.beforeNewFeature = groups[1]; //includes <feature>jaxrs-2.0</feature>
          editorContents.features = groups[2];
          editorContents.afterFeature = groups[3];
      }
      catch (e) {

      }
      return editorContents;
    };


    var __isConfigInFeatures = function(features) {
       var match = false;
       features = features.replace('\n', '');
       features = features.replace(/\s/g, ''); // Remove whitespace
       try {
           var featureMatches = features.match(/<feature>[\s\S]*?<\/feature>/g);
           $(featureMatches).each(function (index, feature) {
               if (feature.indexOf("<feature>mpConfig-1.1</feature>") !== -1) {
                   match = true;
                   return false; // break out of each loop
               }

           });
       }
       catch (e) {

       }
       return match;
   };

  var __checkMicroProfileConfigFeatureContent = function(content) {
      var isConfigFeatureThere = true;
      var editorContentBreakdown = __getMicroProfileConfigFeatureContent(content);
      if (editorContentBreakdown.hasOwnProperty("features")) {
        isConfigFeatureThere =  __isConfigInFeatures(editorContentBreakdown.features);
        if (isConfigFeatureThere) {
              // check for whether other stuffs are there
              var features = editorContentBreakdown.features;
              features = features.replace('\n', '');
              features = features.replace(/\s/g, '');
              console.log("features: ", features);
              if (features.length !== "<feature>mpConfig-1.1</feature>".length) {
                  isConfigFeatureThere = false; // contains extra text
              }
          }
      } else {
          isConfigFeatureThere = false;
      }
      return isConfigFeatureThere;
  };

  var __addMicroProfileConfigFeatureButton = function(event) {
    if (event.type === "click" ||
       (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
        // Click or 'Enter' or 'Space' key event...
        __addMicroProfileConfigFeature();
    }
  };

  var __addMicroProfileConfigFeature = function() {

      var ConfigFeature = "      <feature>mpConfig-1.1</feature>";
      var stepName = stepContent.getCurrentStepName();
      // reset content every time annotation is added through the button so as to clear out any
      // manual editing
      contentManager.resetEditorContents(stepName);
      var content = contentManager.getEditorContents(stepName);

      contentManager.insertEditorContents(stepName, 6, ConfigFeature);
      var readOnlyLines = [];
      // mark cdi feature line readonly
      readOnlyLines.push({
          from: 4,
          to: 4
      });
      contentManager.markEditorReadOnlyLines(stepName, readOnlyLines);
  };

    var __addConfigInjectButton = function(event) {
        if (event.type === "click" ||
        (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
            // Click or 'Enter' or 'Space' key event...
            __addInjectConfigToEditor();
        }
    };

    var __addInjectConfigToEditor = function(stepName) {
        var injectConfig = "    @Inject @ConfigProperty(name=\"download-url\", defaultValue=\"ftp://music.com/us/download\")";
        if (!stepName) {
           stepName = stepContent.getCurrentStepName();
        }
        // reset content every time property is added through the button so as to clear out any manual editing
        contentManager.resetEditorContents(stepName);
        var content = contentManager.getEditorContents(stepName);

        contentManager.replaceEditorContents(stepName, 10, 10, injectConfig, 1);
        var readOnlyLines = [];
        readOnlyLines.push({from: 1, to: 9}, {from: 11, to: 12});
        contentManager.markEditorReadOnlyLines(stepName, readOnlyLines);
    };

    var downloadMusicUrl = "https://music.com/download";

    var __populateURL = function(event, stepName) {
        if (event.type === "click" ||
           (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
               // Click or 'Enter' or 'Space' key event...
            contentManager.setBrowserURL(stepName, downloadMusicUrl);
        }
    };

    var __enterButtonURL = function(event, stepName) {
        if (event.type === "click" ||
        (event.type === "keypress" && (event.which === 13 || event.which === 32))) {
            // Click or 'Enter' or 'Space' key event...
            contentManager.refreshBrowser(stepName);
        }
    };

    var __listenToBrowserForDefaultConfig = function(webBrowser) {
        var setBrowserContent = function(currentURL) {
            webBrowser.setBrowserContent("/guides/iguide-microprofile-config/html/interactive-guides/microprofile-config/download-from-injection.html");
            contentManager.markCurrentInstructionComplete(webBrowser.getStepName());
        }

        webBrowser.addUpdatedURLListener(setBrowserContent);
    };

    return {
        listenToEditorForPropConfig: __listenToEditorForPropConfig,
        listenToEditorForServerEnv: __listenToEditorForServerEnv,
        listenToBrowserForPropFileConfig: __listenToBrowserForPropFileConfig,
        listenToBrowserForServerEnvConfig: __listenToBrowserForServerEnvConfig,
        addPropToConfigProps: __addPropToConfigProps,
        addPropToServerEnvButton: __addPropToServerEnvButton,
        refreshBrowserButton: __refreshBrowserButton,
        saveButton: __saveButton,
        listenToEditorForInjectConfig: __listenToEditorForInjectConfig,
        addConfigInjectButton: __addConfigInjectButton,
        listenToEditorForFeatureInServerXML: __listenToEditorForFeatureInServerXML,
        saveServerXMLButton: __saveServerXMLButton,
        addMicroProfileConfigFeatureButton: __addMicroProfileConfigFeatureButton,
        listenToBrowserForDefaultConfig:  __listenToBrowserForDefaultConfig,
        populateURL:  __populateURL,
        enterButtonURL: __enterButtonURL
    };

})();
