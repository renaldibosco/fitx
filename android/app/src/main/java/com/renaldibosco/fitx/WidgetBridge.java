package com.renaldibosco.fitx;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridge extends Plugin {
    @PluginMethod
    public void refresh(PluginCall call) {
        NrxWidget.updateAll(getContext());
        call.resolve();
    }
}
