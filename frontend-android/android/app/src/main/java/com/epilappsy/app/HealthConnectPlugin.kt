package com.epilappsy.app

import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.activity.result.ActivityResult
import androidx.annotation.RequiresApi
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@RequiresApi(Build.VERSION_CODES.O)
@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {

    private val TAG = "HealthConnect"
    private val sleepPermission = HealthPermission.getReadPermission(SleepSessionRecord::class)
    private val permissions = setOf(sleepPermission)

    @PluginMethod
    fun checkAvailability(call: PluginCall) {
        try {
            val status = HealthConnectClient.getSdkStatus(activity)
            val ret = JSObject()
            ret.put("available", status == HealthConnectClient.SDK_AVAILABLE)
            ret.put("status", status)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("checkAvailability failed: ${e.message}")
        }
    }

    /**
     * Silently checks whether the sleep permission is already granted.
     * Does NOT show any dialog.
     */
    @PluginMethod
    fun getPermissionsStatus(call: PluginCall) {
        Log.d(TAG, "Auth check: getPermissionsStatus called")
        try {
            val status = HealthConnectClient.getSdkStatus(activity)
            if (status != HealthConnectClient.SDK_AVAILABLE) {
                Log.d(TAG, "Auth response: Health Connect not available, status=$status")
                val ret = JSObject()
                ret.put("available", false)
                ret.put("granted", false)
                call.resolve(ret)
                return
            }
            val client = HealthConnectClient.getOrCreate(activity)
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val granted = client.permissionController.getGrantedPermissions()
                    val sleepGranted = sleepPermission in granted
                    Log.d(TAG, "Auth response: Health Connect available, sleep permission granted=$sleepGranted")
                    activity.runOnUiThread {
                        val ret = JSObject()
                        ret.put("available", true)
                        ret.put("granted", sleepGranted)
                        call.resolve(ret)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Auth check failed: ${e.message}")
                    activity.runOnUiThread { call.reject("checkPermissions failed: ${e.message}") }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Auth check error: ${e.message}")
            call.reject("checkPermissions failed: ${e.message}")
        }
    }

    /**
     * Requests the sleep permission from the user via the Health Connect dialog.
     * If already granted, resolves immediately without showing a dialog.
     */
    @PluginMethod
    fun requestHealthPermissions(call: PluginCall) {
        Log.d(TAG, "Auth check: requestHealthPermissions called")
        try {
            val status = HealthConnectClient.getSdkStatus(activity)
            if (status != HealthConnectClient.SDK_AVAILABLE) {
                Log.d(TAG, "Auth response: Health Connect not available, status=$status")
                call.reject("Health Connect SDK status: $status (not available)")
                return
            }
            val client = HealthConnectClient.getOrCreate(activity)
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val granted = client.permissionController.getGrantedPermissions()
                    if (sleepPermission in granted) {
                        Log.d(TAG, "Auth response: sleep permission already granted")
                        activity.runOnUiThread {
                            val ret = JSObject()
                            ret.put("granted", true)
                            call.resolve(ret)
                        }
                        return@launch
                    }
                    Log.d(TAG, "Auth check: launching permission dialog")
                    activity.runOnUiThread {
                        try {
                            val contract = PermissionController.createRequestPermissionResultContract()
                            val intent = contract.createIntent(activity, permissions)
                            startActivityForResult(call, intent, "handlePermissionsResult")
                        } catch (e: Exception) {
                            Log.e(TAG, "Auth check: failed to launch permission dialog: ${e.message}")
                            call.reject("Failed to launch permission dialog: ${e.message}")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Auth check failed: ${e.message}")
                    activity.runOnUiThread { call.reject("Permission check failed: ${e.message}") }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Auth check error: ${e.message}")
            call.reject("requestHealthPermissions failed: ${e.message}")
        }
    }

    @ActivityCallback
    private fun handlePermissionsResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        try {
            val client = HealthConnectClient.getOrCreate(activity)
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val granted = client.permissionController.getGrantedPermissions()
                    val sleepGranted = sleepPermission in granted
                    Log.d(TAG, "Auth response: permission dialog closed, sleep granted=$sleepGranted")
                    activity.runOnUiThread {
                        val ret = JSObject()
                        ret.put("granted", sleepGranted)
                        call.resolve(ret)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Auth response: handlePermissionsResult failed: ${e.message}")
                    activity.runOnUiThread { call.reject("handlePermissionsResult failed: ${e.message}") }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Auth response: handlePermissionsResult error: ${e.message}")
            call.reject("handlePermissionsResult failed: ${e.message}")
        }
    }

    @PluginMethod
    fun openHealthConnectSettings(call: PluginCall) {
        try {
            val intent = Intent("androidx.health.ACTION_MANAGE_HEALTH_PERMISSIONS").apply {
                putExtra(Intent.EXTRA_PACKAGE_NAME, activity.packageName)
            }
            if (intent.resolveActivity(activity.packageManager) != null) {
                activity.startActivity(intent)
                call.resolve()
                return
            }
            val fallback = activity.packageManager.getLaunchIntentForPackage("com.google.android.apps.healthdata")
                ?: activity.packageManager.getLaunchIntentForPackage("com.samsung.android.health")
            if (fallback != null) {
                activity.startActivity(fallback)
                call.resolve()
            } else {
                call.reject("Could not open Health Connect")
            }
        } catch (e: Exception) {
            call.reject("openHealthConnectSettings failed: ${e.message}")
        }
    }

    /**
     * Returns sleep sessions grouped by wakeup day for a given month.
     * @param year  4-digit year
     * @param month 1-indexed month (1 = January, 12 = December)
     * Returns: { days: JSON string of SleepDay[] }
     * SleepDay: { date: "YYYY-MM-DD", totalMinutes: int, totalHours: double, belowThreshold: bool }
     */
    @PluginMethod
    fun getSleepForMonth(call: PluginCall) {
        val year  = call.getInt("year")  ?: LocalDate.now().year
        val month = call.getInt("month") ?: LocalDate.now().monthValue
        Log.d(TAG, "GET sleep data: getSleepForMonth called for $year-${month.toString().padStart(2, '0')}")
        try {
            if (HealthConnectClient.getSdkStatus(activity) != HealthConnectClient.SDK_AVAILABLE) {
                Log.e(TAG, "GET sleep data: Health Connect not available")
                call.reject("Health Connect not available")
                return
            }
            val client = HealthConnectClient.getOrCreate(activity)
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val startDate = LocalDate.of(year, month, 1)
                    val endDate   = startDate.plusMonths(1)
                    val start = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()
                    val end   = endDate.atStartOfDay(ZoneId.systemDefault()).toInstant()

                    val response = client.readRecords(
                        ReadRecordsRequest<SleepSessionRecord>(
                            SleepSessionRecord::class,
                            TimeRangeFilter.between(start, end)
                        )
                    )
                    Log.d(TAG, "GET sleep data response for $year-${month.toString().padStart(2, '0')}: ${response.records.size} session(s) found")

                    // Group sessions by the day the user woke up (endTime date)
                    val dayMap = mutableMapOf<String, Long>()
                    for (record in response.records) {
                        val wakeDate  = record.endTime.atZone(ZoneId.systemDefault()).toLocalDate()
                        val dateStr   = wakeDate.toString()
                        val durationMin = (record.endTime.toEpochMilli() - record.startTime.toEpochMilli()) / 60000L
                        dayMap[dateStr] = (dayMap[dateStr] ?: 0L) + durationMin
                        Log.d(TAG, "  Session: wakeDate=$dateStr durationMin=$durationMin")
                    }

                    val sleepDays = JSONArray()
                    for ((date, totalMin) in dayMap.entries.sortedBy { it.key }) {
                        val hours = totalMin / 60.0
                        val day = JSONObject()
                        day.put("date", date)
                        day.put("totalMinutes", totalMin.toInt())
                        day.put("totalHours", hours)
                        day.put("belowThreshold", hours < 8.0)
                        sleepDays.put(day)
                    }
                    Log.d(TAG, "GET sleep data grouped: ${sleepDays.length()} day(s) with sleep data")

                    activity.runOnUiThread {
                        val ret = JSObject()
                        ret.put("days", sleepDays.toString())
                        call.resolve(ret)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "GET sleep data failed: ${e.message}")
                    activity.runOnUiThread { call.reject("Failed to read sleep: ${e.message}") }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "GET sleep data error: ${e.message}")
            call.reject("getSleepForMonth failed: ${e.message}")
        }
    }

    /** Legacy: last 2 days of sleep (kept for backwards compatibility) */
    @PluginMethod
    fun getSleepLastNight(call: PluginCall) {
        Log.d(TAG, "GET sleep data: getSleepLastNight called")
        try {
            if (HealthConnectClient.getSdkStatus(activity) != HealthConnectClient.SDK_AVAILABLE) {
                call.reject("Health Connect not available")
                return
            }
            val client = HealthConnectClient.getOrCreate(activity)
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val end   = Instant.now()
                    val start = LocalDate.now().minusDays(2)
                        .atStartOfDay(ZoneId.systemDefault()).toInstant()

                    val response = client.readRecords(
                        ReadRecordsRequest<SleepSessionRecord>(
                            SleepSessionRecord::class,
                            TimeRangeFilter.between(start, end)
                        )
                    )
                    Log.d(TAG, "GET sleep data response (lastNight): ${response.records.size} session(s)")

                    var totalMinutes = 0L
                    val sessions = JSONArray()
                    for (record in response.records) {
                        val durationMin =
                            (record.endTime.toEpochMilli() - record.startTime.toEpochMilli()) / 60000L
                        totalMinutes += durationMin
                        val session = JSONObject()
                        session.put("startTime", record.startTime.toString())
                        session.put("endTime", record.endTime.toString())
                        session.put("durationMinutes", durationMin.toInt())
                        sessions.put(session)
                    }

                    val totalHours: Double = totalMinutes / 60.0
                    activity.runOnUiThread {
                        val ret = JSObject()
                        ret.put("totalMinutes", totalMinutes.toInt())
                        ret.put("totalHours", totalHours)
                        ret.put("belowThreshold", totalHours < 8.0)
                        ret.put("sessions", sessions.toString())
                        ret.put("sessionCount", sessions.length())
                        call.resolve(ret)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "GET sleep data (lastNight) failed: ${e.message}")
                    activity.runOnUiThread { call.reject("Failed to read sleep: ${e.message}") }
                }
            }
        } catch (e: Exception) {
            call.reject("getSleepLastNight failed: ${e.message}")
        }
    }
}
