package com.renaldibosco.fitx;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class NrxWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) render(context, manager, id);
    }

    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, NrxWidget.class));
        for (int id : ids) render(context, manager, id);
    }

    private static void render(Context context, AppWidgetManager manager, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_nrx);
        String next = "Open NrXFitz to start";
        String streak = "0";
        String week = "0 / 0 this week";
        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String raw = prefs.getString("widget", null);
            if (raw != null) {
                JSONObject o = new JSONObject(raw);
                next = o.optString("next", next);
                streak = String.valueOf(o.optInt("streak", 0));
                week = o.optInt("week", 0) + " / " + o.optInt("target", 0) + " this week";
            }
        } catch (Exception ignored) { }
        views.setTextViewText(R.id.w_next, next);
        views.setTextViewText(R.id.w_streak, streak);
        views.setTextViewText(R.id.w_week, week);

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.w_root, pi);
        manager.updateAppWidget(id, views);
    }
}
