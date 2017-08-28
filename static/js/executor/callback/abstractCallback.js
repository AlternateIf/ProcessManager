pimcore.registerNS("pimcore.plugin.processmanager.executor.callback.abstractCallback");
pimcore.plugin.processmanager.executor.callback.abstractCallback = Class.create(pimcore.plugin.processmanager.helper.form,{
    executionUrl : "/plugin/ProcessManager/config/execute",

    grid : null,
    rowIndex : null,
    record : null,
    config : null,
    callbackWindowType : 'window',

    settings : {
        windowWidth: 800,
        windowHeight: 400,
        windowTitle : t('plugin_pm_callback_title')
    },

    reset : function () {
        this.specialFormFields = [];
        this.mandatoryFields = [];
    },

    initialize : function (grid,rowIndex) {

        this.grid = grid;
        this.rowIndex = rowIndex;
        if(this.grid){
            this.record = this.grid.getStore().getAt(this.rowIndex);
        }
    },

    getIdKey : function (key) {
        if(this.config){
            return key + this.config.id;
        }else if(this.record){
            return key + this.record.get('id');
        }else{
            return key + 'tmp';
        }
    },

    /**
     * record is set only by predefined callback settings
     * @param record
     */
    setRecord : function(record){
        this.record = record;
    },

    setConfig : function (config) {
        this.config = config;
    },

    applyCallbackSettings : function(data){

        if(data){
            this.setFormData(data);
        }else if(this.record){
            this.callbackSettingsForm.getForm().findField('name').setValue(this.record.get('name'));
            this.callbackSettingsForm.getForm().findField('description').setValue(this.record.get('description'));
            var settings = this.record.get('extJsSettings');
            this.setFormData(settings);
        }
    },

    setFormData : function (data) {

       // data.myDate = new Date(data.myDate*1000);


        this.formPanel.getForm().setValues(data);
        for(var i =0; i < this.specialFormFields.length; i++){
            var rec = this.specialFormFields[i];
            var method = 'setStorageValue' + Ext.util.Format.capitalize(rec.type);
            if(typeof this[method] == 'function'){
                this[method](rec.name,data);
            }else{
                alert('You have to implement the method: ' + method + '()');
            }
        }
    },

    openSaveSettings : function(){

        var items = [];

        var fieldSetGeneral = new Ext.form.FieldSet({
            title: t("plugin_pm_field_set_general"),
            combineErrors:false,
            items:[this.getTextField('name',{mandatory : true}),
                this.getTextArea('description')]
        });
        items.push(fieldSetGeneral);


        var fieldSetConfiguration = new Ext.form.FieldSet({
            title: t("plugin_pm_field_set_configuration"),
            combineErrors:false,
            items:[this.getFormPanel()]
        });
        items.push(fieldSetConfiguration);

        this.callbackSettingsForm = new Ext.FormPanel({
            border: false,
            autoScroll: true,
            bodyPadding: 15,
            items: items
        });

        this.buttons = [
            {
                xtype: 'button',
                scale: "medium",
                //autoWidth : true,
                text: t("plugin_pm_callback_settings_save"),
                icon : '/pimcore/static6/img/flat-color-icons/ok.svg',
                hideLabel: true,
                handler: function(){
                    var settings = this.getStorageValues();
                    var values = this.callbackSettingsForm.getValues();

                    var merged = Ext.merge(values,settings);

                    var errors = this.formHasErrors(merged);
                    if(errors){
                        this.alertFormErrors(errors);
                        return false;
                    }
                    var params = {values : Ext.encode(values),
                        settings: Ext.encode(settings),
                        type : this.name
                    };

                    if(this.record){
                        params.id = this.record.get('id');
                    }
                    Ext.Ajax.request({
                        url: '/plugin/ProcessManager/callback-settings/save',
                        method : 'post',
                        params: params,
                        failure: function (response) {
                            alert('Error at execution');
                        }.bind(this),
                        success: function (response) {
                            var data = Ext.decode(response.responseText);
                            if (data.success) {
                                pimcore.helpers.showNotification(t("success"), t("plugin_pm_config_callback_save_success"), "success");
                                Ext.getCmp('plugin_pm_callback_settings_panel').store.reload();
                                this.saveSettingsWindow.close();
                            } else {
                                pimcore.helpers.showNotification(t("error"), t("plugin_pm_config_callback_save_error"), "error", data.message);
                            }
                        }.bind(this)
                    });

                }.bind(this)
            },
            {
                text: t("cancel"),
                scale: "medium",
                iconCls: "pimcore_icon_cancel",
                handler: function(){
                    this.saveSettingsWindow.close();
                }.bind(this)
            }
        ];

        this.applyCallbackSettings();

        this['openSaveSettings' + this.callbackWindowType.ucFirst()]();
    },

    openSaveSettingsTab : function () {
        var tabId = this.getIdKey("plugin_pm_config_tab_cfg_");
        var tab = Ext.getCmp(tabId);

        if(tab){
            var tabPanel = Ext.getCmp("pimcore_panel_tabs");
            tabPanel.setActiveItem(tabId);
        }else{
            var tbar = [];
            tbar.push(this.getConfigSelection());

            var title = t("plugin_pm_callback_settings_save");
            if(this.record){
                title += ' (' + this.record.get('name') + ')';
            }
            this.saveSettingsWindow = new Ext.Panel({
                title: title,
                id: tabId,
                border: false,
                layout: "fit",
                icon : '/pimcore/static6/img/flat-color-icons/settings.svg',
                closable:true,
                items:[this.callbackSettingsForm],
                tbar:  tbar,
                buttons : this.buttons
            });

            var tabPanel = Ext.getCmp("pimcore_panel_tabs");
            tabPanel.add(this.saveSettingsWindow);
            tabPanel.setActiveItem(tabId);

            this.saveSettingsWindow.on("destroy", function () {
                pimcore.globalmanager.remove(tabId);
            }.bind(this));
        }

    },
    openSaveSettingsWindow : function(){
        this.saveSettingsWindow = new Ext.Window({
            id:'callbackSettingsWindow',
            autoScroll: true,
            height: '80%',
            layout : "fit",
            title: t("plugin_pm_callback_settings_save"),
            icon : '/pimcore/static6/img/flat-color-icons/settings.svg',
            modal:false,
            width: 700,
            items:[this.callbackSettingsForm],
            buttons : this.buttons
        });

        this.saveSettingsWindow.show();

    },

    getWindowButtons : function(){
        var buttons = [

            {
                xtype: 'button',
                scale: "medium",
                //autoWidth : true,
                text: t("plugin_pm_permission_execute_button"),
                icon : '/pimcore/static6/img/flat-color-icons/go.svg',
                hideLabel: true,
                style: {
                   // marginLeft: (this.settings.windowWidth-215) + 'px'
                },
                handler: this.doExecute.bind(this)
            },
            {
                text: t("cancel"),
                scale: "medium",
                iconCls: "pimcore_icon_cancel",
                handler: this.closeWindow.bind(this)
            }
        ];
        return buttons;
    },

    execute : function () {
        //call openConfigWindow/openConfigTab if form items are defined
        if(typeof this['getFormItems'] == 'function'){
            this['openConfig' + this.callbackWindowType.ucFirst()]();
        }else{
            this.doExecute();
        }
    },

    getStorageValues : function () {
        var data = [];
        if(this.formPanel){
            data = this.formPanel.getForm().getValues();
        }

        for(var i =0; i < this.specialFormFields.length; i++){
            var rec = this.specialFormFields[i];
            var method = 'getStorageValue' + Ext.util.Format.capitalize(rec.type);
            data[rec.name] = this[method](rec.name);
        }
        return data;
    },




    doExecute : function () {
        var data = this.getStorageValues();

        var errors = this.formHasErrors(data);
        if(errors){
            this.alertFormErrors(errors);
            return false;
        }

        if(this.config){
            var id = this.config.id;
        }else{
            var id = this.record.get('id');
        }

        var params = {id: id,
                      callbackSettings: Ext.encode(data)};

        if(this.window){
            if(!this.callbackWindowKeepOpen){
                this.closeWindow();
            }
        }

        Ext.Ajax.request({
            url: this.executionUrl,
            method : 'post',
            params: params,
            failure: function (response) {
                alert('Error at execution');
            }.bind(this),
            success: function (response) {
                var data = Ext.decode(response.responseText);
                if (data.success) {
                    pimcore.helpers.showNotification(t("success"), t("plugin_pm_config_execution_success"), "success");
                    if(Ext.getCmp("pimcore_plugin_pm_panel")){
                        Ext.getCmp("pimcore_plugin_pm_panel").setActiveTab(1);
                    }else{
                        processmanagerPlugin.showProcessManager({activeTab : 1});
                    }

                    var pm = pimcore.globalmanager.get("plugin_pm_cnf");

                    var column = pm.monitoringItems.grid.columnManager.getColumns()[0];
                    column.filter.setValue({eq : data.monitoringItemId});
                    column.filter.setActive(true);
                    pm.monitoringItems.grid.store.reload();
                } else {
                    pimcore.helpers.showNotification(t("error"), t("plugin_pm_config_execution_error"), "error", data.message);
                }
                if(this.store){
                    this.store.reload();
                }
            }.bind(this.grid)
        });
    },

    getFormPanel : function () {
        this.formPanel = new Ext.FormPanel({
            id : this.getIdKey("plugin_pm_executor_callback_form_"),
            //title : '',
            border: false,
            autoScroll: true,

            bodyPadding: 15,
            items: this.getFormItems()
        });



        return this.formPanel;
    },

    getConfigSelection : function () {
        var configStore = new Ext.data.Store({
            proxy: {
                url: '/plugin/ProcessManager/callback-settings/list?type=' + this.name,
                type: 'ajax',
                reader: {
                    type: 'json',
                    rootProperty: "data"
                }
            },
            fields: ["id","name","description","settings","type"]
        });

        return  {
            fieldLabel: t('plugin_pm_predefined_callback_settings'),
            name: 'docType',
            labelWidth: 120,
            xtype: "combo",
            displayField:'name',
            valueField: "id",
            store: configStore,
            editable: false,
            width : 400,
            triggerAction: 'all',
            value: '',
            listeners: {
                "select": function(a,record){
                    var data = record.getData();
                    Ext.getCmp(this.getIdKey("plugin_pm_executor_callback_form_")).getForm().reset();
                    this.applyCallbackSettings(data.extJsSettings);
                }.bind(this)
            }
        };
    },

    openConfigWindow : function () {
        var tbar = [];
        tbar.push(this.getConfigSelection());
        this.window = new Ext.Window({
            id:'editWindow',
            autoScroll: true,

            height: this.settings.windowHeight,
            layout : "fit",
            title: this.settings.windowTitle,
            iconCls: "pm_icon_cli",
            modal:false,
            width:this.settings.windowWidth,
            close : this.closeWindow.bind(this),
            items:[this.getFormPanel()],
            buttons : this.getWindowButtons(),
            tbar:  tbar
        });

        this.window.show();
    },

    openConfigTab : function () {
        var tabId = "plugin_pm_config_tab_" + this.config.id;

        var tab = Ext.getCmp(tabId);

        if(tab){
            var tabPanel = Ext.getCmp("pimcore_panel_tabs");
            tabPanel.setActiveItem(tabId);
        }else{
            var tbar = [];
            tbar.push(this.getConfigSelection());
            this.window = new Ext.Panel({
                title: t('plugin_pm_callback_title') + ' (' + this.config.name + ')',
                id: tabId,
                border: false,

                layout: "fit",
                iconCls: "pm_icon_cli",
                closable:true,
                items:[this.getFormPanel()],
                tbar:  tbar,
                buttons : this.getWindowButtons()
            });

            var tabPanel = Ext.getCmp("pimcore_panel_tabs");
            tabPanel.add(this.window);
            tabPanel.setActiveItem(tabId);

            this.window.on("destroy", function () {
                pimcore.globalmanager.remove(tabId);
            }.bind(this));
        }
    },

    closeWindow : function(){
        this.window.destroy();
    }
});