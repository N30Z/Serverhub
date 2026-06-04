-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

-keep,includedescriptorclasses class com.serverhub.android.**$$serializer { *; }
-keepclassmembers class com.serverhub.android.** {
    *** Companion;
}
-keepclasseswithmembers class com.serverhub.android.** {
    kotlinx.serialization.KSerializer serializer(...);
}

-keep class com.serverhub.android.data.model.** { *; }
