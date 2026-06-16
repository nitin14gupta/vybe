import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { type Region } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Minus,
  Plus,
  X,
} from "lucide-react-native";
import { Colors, FontFamily } from "@/constants";
import { DateTimePickerSheet, useDateTimePicker } from "@/components/ui";
import { useCreateEvent } from "@/hooks/useCreateEvent";
import ApiService from "@/api/apiService";
import { Screen } from "@/components/ui";

const { width: W } = Dimensions.get("window");

const EVENT_TYPES = [
  { key: "house_party", label: "House Party", emoji: "🎉" },
  { key: "rooftop", label: "Rooftop", emoji: "🌆" },
  { key: "game_night", label: "Game Night", emoji: "🎮" },
  { key: "dinner", label: "Dinner", emoji: "🍽️" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "other", label: "Other", emoji: "🔥" },
];

const AGE_OPTIONS: Array<18 | 21 | 25> = [18, 21, 25];

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111111" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d0d0d" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1c1c1c" }],
  },
];

function fmt(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <View style={styles.stepBar}>
      {[1, 2, 3, 4].map((n) => (
        <View
          key={n}
          style={[styles.stepSegment, n <= step && styles.stepSegmentActive]}
        />
      ))}
    </View>
  );
}

// ── Field row (date/time picker trigger) ──────────────────────────────────────

function PickerRow({
  icon,
  label,
  value,
  onPress,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
}) {
  return (
    <Pressable style={styles.pickerRow} onPress={onPress}>
      <View style={styles.pickerIcon}>{icon}</View>
      <View style={styles.pickerContent}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <Text style={[styles.pickerValue, !value && styles.pickerPlaceholder]}>
          {value || placeholder || "Tap to select"}
        </Text>
      </View>
      <ChevronRight size={16} color={Colors.inkDisabled} />
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const router = useRouter();
  const { form, set, reset, submit, submitting, submitError } =
    useCreateEvent();
  const dtPicker = useDateTimePicker();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mapRef = useRef<MapView>(null);

  // ── Validation per step ──

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!form.title.trim()) errs.title = "Event title is required";
      if (!form.eventType) errs.eventType = "Please select an event type";
    }

    if (step === 2) {
      if (!form.dateTime) {
        errs.dateTime = "Event date is required";
      } else {
        const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (form.dateTime < minDate) {
          errs.dateTime = "Events must be posted at least 24 hours in advance";
        }
      }
      if (form.endTime && form.dateTime) {
        // Compare hours+minutes only — both times are on the same calendar day
        const startMins = form.dateTime.getHours() * 60 + form.dateTime.getMinutes()
        const endMins   = form.endTime.getHours()  * 60 + form.endTime.getMinutes()
        if (endMins <= startMins) {
          errs.endTime = 'End time must be after start time'
        }
      }
      if (form.capacity < 5) errs.capacity = "Minimum 5 guests required";
      if (form.capacity > 200) errs.capacity = "Maximum 200 guests allowed";
    }

    if (step === 3) {
      if (!form.locationName.trim()) errs.locationName = "Location is required";
    }

    if (step === 4) {
      if (!form.isFree && form.priceInr < 50) {
        errs.priceInr = "Minimum ticket price is ₹50";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < 4) setStep((step + 1) as 1 | 2 | 3 | 4);
  };

  const back = () => {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4);
  };

  const publish = async () => {
    if (!validateStep()) return;
    const result = await submit();
    if (result) {
      reset();
      setStep(1);
      router.replace(`/(events)/${result.id}` as any);
    }
  };

  // ── Date/time pickers ──

  const openDate = async () => {
    Keyboard.dismiss()
    // seed picker with current dateTime (or now), preserving existing date selection
    const seed = form.dateTime ?? new Date()
    const picked = await dtPicker.open('date', seed)
    // preserve existing start-time if already set
    const merged = new Date(picked)
    if (form.dateTime) {
      merged.setHours(form.dateTime.getHours(), form.dateTime.getMinutes(), 0, 0)
    }
    set('dateTime', merged)
  }

  const openStartTime = async () => {
    Keyboard.dismiss()
    // seed with current dateTime so wheels show existing selection
    const seed = form.dateTime ?? new Date()
    const picked = await dtPicker.open('time', seed)
    // apply picked hours/minutes onto the same calendar date
    const merged = new Date(form.dateTime ?? new Date())
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
    set('dateTime', merged)
  }

  const openEndTime = async () => {
    Keyboard.dismiss()
    // default end time = start time + 1 hour, on the SAME date as dateTime
    const base = form.dateTime
      ? new Date(form.dateTime.getTime() + 60 * 60 * 1000)
      : new Date()
    const seed = form.endTime
      ? (() => {
          // re-anchor endTime onto today's date so picker shows correct time
          const s = new Date(form.dateTime ?? new Date())
          s.setHours(form.endTime.getHours(), form.endTime.getMinutes(), 0, 0)
          return s
        })()
      : base
    const picked = await dtPicker.open('time', seed)
    // ALWAYS anchor to form.dateTime's calendar date — prevents cross-day comparison bugs
    const merged = new Date(form.dateTime ?? new Date())
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
    set('endTime', merged)
  }

  // ── Photo picker ──

  const pickPhoto = async (position: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to add event photos",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    try {
      const url = await ApiService.uploadPhoto(uri, position);
      const photos = [...form.coverPhotos];
      photos[position] = url;
      set("coverPhotos", photos);
    } catch (e: any) {
      Alert.alert("Upload failed", e.message);
    }
  };

  const removePhoto = (position: number) => {
    const photos = [...form.coverPhotos];
    photos.splice(position, 1);
    set("coverPhotos", photos);
  };

  // ── India bounds warning ──

  const isOutsideIndia =
    form.locationLat != null &&
    form.locationLng != null &&
    (form.locationLat < 6 ||
      form.locationLat > 36 ||
      form.locationLng < 68 ||
      form.locationLng > 98);

  // ── Render steps ──

  const renderStep1 = () => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepTitle}>The Basics</Text>
      <Text style={styles.stepSub}>Tell people what your event is about</Text>

      <Text style={styles.fieldLabel}>Event Title *</Text>
      <View style={[styles.inputWrap, errors.title && styles.inputWrapError]}>
        <TextInput
          style={styles.textInput}
          value={form.title}
          onChangeText={(v) => {
            set("title", v.slice(0, 60));
            setErrors((e) => ({ ...e, title: "" }));
          }}
          placeholder="What's the vibe called?"
          placeholderTextColor={Colors.inkDisabled}
          maxLength={60}
        />
        <Text style={styles.charCount}>{form.title.length}/60</Text>
      </View>
      {errors.title ? (
        <Text style={styles.errorText}>{errors.title}</Text>
      ) : null}

      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Event Type *</Text>
      {errors.eventType ? (
        <Text style={styles.errorText}>{errors.eventType}</Text>
      ) : null}
      <View style={styles.typeGrid}>
        {EVENT_TYPES.map((t) => (
          <Pressable
            key={t.key}
            style={[
              styles.typeChip,
              form.eventType === t.key && styles.typeChipActive,
            ]}
            onPress={() => {
              set("eventType", t.key);
              setErrors((e) => ({ ...e, eventType: "" }));
            }}
          >
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text
              style={[
                styles.typeLabel,
                form.eventType === t.key && styles.typeLabelActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Description</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={form.description}
          onChangeText={(v) => set("description", v.slice(0, 500))}
          placeholder="Tell people about the vibe..."
          placeholderTextColor={Colors.inkDisabled}
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{form.description.length}/500</Text>
      </View>

      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>
        House Rules (optional)
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={form.rules}
          onChangeText={(v) => set("rules", v.slice(0, 200))}
          placeholder="No shoes inside, BYO drinks..."
          placeholderTextColor={Colors.inkDisabled}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{form.rules.length}/200</Text>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepTitle}>When is it happening?</Text>
      <Text style={styles.stepSub}>Set the date, time, and capacity</Text>

      <PickerRow
        icon={<Calendar size={18} color={Colors.brandOrange} />}
        label="Date"
        value={form.dateTime ? fmt(form.dateTime) : ""}
        placeholder="Select a date"
        onPress={openDate}
      />
      {errors.dateTime ? (
        <Text style={styles.errorText}>{errors.dateTime}</Text>
      ) : null}

      <View style={styles.timeRow}>
        <View style={{ flex: 1 }}>
          <PickerRow
            icon={<Clock size={18} color={Colors.brandOrange} />}
            label="Start Time"
            value={form.dateTime ? fmtTime(form.dateTime) : ""}
            onPress={openStartTime}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PickerRow
            icon={<Clock size={18} color={Colors.inkSecondary} />}
            label="End Time"
            value={form.endTime ? fmtTime(form.endTime) : ""}
            placeholder="Optional"
            onPress={openEndTime}
          />
        </View>
      </View>
      {errors.endTime ? (
        <Text style={styles.errorText}>{errors.endTime}</Text>
      ) : null}

      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Max Guests</Text>
      <View style={styles.stepperRow}>
        <Pressable
          style={styles.stepperBtn}
          onPress={() => set("capacity", Math.max(5, form.capacity - 5))}
        >
          <Minus size={18} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={styles.stepperValue}>{form.capacity}</Text>
        <Pressable
          style={styles.stepperBtn}
          onPress={() => set("capacity", Math.min(200, form.capacity + 5))}
        >
          <Plus size={18} color={Colors.inkPrimary} />
        </Pressable>
      </View>
      {errors.capacity ? (
        <Text style={styles.errorText}>{errors.capacity}</Text>
      ) : null}

      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>
        Age Restriction
      </Text>
      <View style={styles.ageRow}>
        {AGE_OPTIONS.map((age) => (
          <Pressable
            key={age}
            style={[
              styles.ageChip,
              form.ageRestriction === age && styles.ageChipActive,
            ]}
            onPress={() => set("ageRestriction", age)}
          >
            <Text
              style={[
                styles.ageText,
                form.ageRestriction === age && styles.ageTextActive,
              ]}
            >
              {age}+
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <View style={styles.step3Container}>
      <ScrollView
        style={styles.stepScroll}
        contentContainerStyle={[styles.stepContent, { paddingBottom: 0 }]}
      >
        <Text style={styles.stepTitle}>Where's the VYBE?</Text>
        <Text style={styles.stepSub}>Set your event location</Text>

        <Text style={styles.fieldLabel}>Address *</Text>
        <View
          style={[
            styles.inputWrap,
            errors.locationName && styles.inputWrapError,
          ]}
        >
          <MapPin
            size={16}
            color={Colors.brandOrange}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            value={form.locationName}
            onChangeText={(v) => {
              set("locationName", v);
              setErrors((e) => ({ ...e, locationName: "" }));
            }}
            placeholder="e.g. 142 Carter Rd, Bandra West"
            placeholderTextColor={Colors.inkDisabled}
          />
        </View>
        {errors.locationName ? (
          <Text style={styles.errorText}>{errors.locationName}</Text>
        ) : null}

        <Text style={styles.locationNote}>
          📍 Exact address is only shown to confirmed guests
        </Text>

        {isOutsideIndia && (
          <View style={styles.indiaBanner}>
            <Text style={styles.indiaBannerText}>
              ⚠️ Location appears to be outside India — are you sure?
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Map with centred pin */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          customMapStyle={DARK_MAP_STYLE}
          initialRegion={{
            latitude: form.locationLat ?? 19.076,
            longitude: form.locationLng ?? 72.877,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onRegionChangeComplete={(region: Region) => {
            set("locationLat", region.latitude);
            set("locationLng", region.longitude);
          }}
        />
        {/* Fixed centre pin */}
        <View style={styles.mapCentrePin} pointerEvents="none">
          <MapPin
            size={32}
            color={Colors.brandOrange}
            fill={Colors.brandOrange}
          />
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={styles.stepContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepTitle}>Pricing & Photos</Text>
      <Text style={styles.stepSub}>Set the entry fee and add some photos</Text>

      {/* Pricing card */}
      <View style={styles.pricingCard}>
        <View style={styles.pricingToggle}>
          <Pressable
            style={[styles.pricingBtn, form.isFree && styles.pricingBtnActive]}
            onPress={() => {
              set("isFree", true);
              set("priceInr", 0);
            }}
          >
            <Text
              style={[
                styles.pricingBtnText,
                form.isFree && styles.pricingBtnTextActive,
              ]}
            >
              Free
            </Text>
          </Pressable>
          <Pressable
            style={[styles.pricingBtn, !form.isFree && styles.pricingBtnActive]}
            onPress={() => set("isFree", false)}
          >
            <Text
              style={[
                styles.pricingBtnText,
                !form.isFree && styles.pricingBtnTextActive,
              ]}
            >
              Paid
            </Text>
          </Pressable>
        </View>

        {!form.isFree && (
          <View
            style={[
              styles.inputWrap,
              { marginTop: 12 },
              errors.priceInr && styles.inputWrapError,
            ]}
          >
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={form.priceInr > 0 ? String(form.priceInr) : ""}
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                set("priceInr", isNaN(n) ? 0 : n);
                setErrors((e) => ({ ...e, priceInr: "" }));
              }}
              placeholder="Ticket price"
              placeholderTextColor={Colors.inkDisabled}
              keyboardType="numeric"
            />
          </View>
        )}
        {errors.priceInr ? (
          <Text style={styles.errorText}>{errors.priceInr}</Text>
        ) : null}
      </View>

      {/* Photos grid */}
      <Text style={[styles.fieldLabel, { marginTop: 24 }]}>
        Event Photos (up to 5)
      </Text>
      <View style={styles.photosGrid}>
        {/* Large cover slot */}
        <Pressable style={styles.photoCoverSlot} onPress={() => pickPhoto(0)}>
          {form.coverPhotos[0] ? (
            <>
              <Image source={{ uri: form.coverPhotos[0] }} contentFit="cover" />
              <Pressable
                style={styles.photoRemove}
                onPress={() => removePhoto(0)}
              >
                <X size={12} color="#fff" />
              </Pressable>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Plus size={24} color={Colors.inkDisabled} />
              <Text style={styles.photoPlaceholderText}>Cover</Text>
            </View>
          )}
        </Pressable>

        {/* 4 smaller slots */}
        <View style={styles.photoSmallGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Pressable
              key={i}
              style={styles.photoSmallSlot}
              onPress={() => pickPhoto(i)}
            >
              {form.coverPhotos[i] ? (
                <>
                  <Image
                    source={{ uri: form.coverPhotos[i] }}
                    contentFit="cover"
                  />
                  <Pressable
                    style={styles.photoRemove}
                    onPress={() => removePhoto(i)}
                  >
                    <X size={10} color="#fff" />
                  </Pressable>
                </>
              ) : (
                <Plus size={18} color={Colors.inkDisabled} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {submitError ? (
        <View style={styles.submitError}>
          <Text style={styles.submitErrorText}>{submitError}</Text>
        </View>
      ) : null}
    </ScrollView>
  );

  const isLastStep = step === 4;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header]}>
          <Pressable
            style={styles.headerClose}
            onPress={() => {
              if (step > 1) {
                back();
              } else {
                router.back();
              }
            }}
          >
            {step > 1 ? (
              <Text style={styles.headerBackText}>← Back</Text>
            ) : (
              <X size={22} color={Colors.inkPrimary} />
            )}
          </Pressable>
          <Text style={styles.headerTitle}>Create Event</Text>
          <Text style={styles.headerStep}>Step {step}/4</Text>
        </View>

        <StepBar step={step} />

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Bottom bar */}
        {step !== 3 && (
          <View style={[styles.bottomBar, { paddingBottom: 12 }]}>
            <Pressable
              onPress={isLastStep ? publish : next}
              style={styles.nextBtn}
              disabled={submitting}
            >
              <LinearGradient
                colors={["#FF6B35", "#FF3864"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextGradient}
              >
                <Text style={styles.nextText}>
                  {submitting
                    ? "Publishing..."
                    : isLastStep
                      ? "Publish Event 🔥"
                      : "Next Step →"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <View style={[styles.bottomBar, { paddingBottom: 12 }]}>
            <Pressable onPress={next} style={styles.nextBtn}>
              <LinearGradient
                colors={["#FF6B35", "#FF3864"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextGradient}
              >
                <Text style={styles.nextText}>Next Step →</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* DateTimePickerSheet */}
        <DateTimePickerSheet
          visible={dtPicker.visible}
          mode={dtPicker.mode}
          value={dtPicker.value}
          onConfirm={dtPicker.confirm}
          onDismiss={dtPicker.dismiss}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerClose: { width: 70, justifyContent: "flex-start" },
  headerBackText: {
    color: Colors.brandOrange,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: Colors.inkPrimary,
  },
  headerStep: {
    width: 70,
    textAlign: "right",
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },

  stepBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 4,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  stepSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.elevated,
  },
  stepSegmentActive: { backgroundColor: Colors.brandOrange },

  stepScroll: { flex: 1 },
  stepContent: { padding: 24, paddingBottom: 40 },
  stepTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: Colors.inkPrimary,
    marginBottom: 6,
  },
  stepSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    marginBottom: 24,
  },

  fieldLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 52,
  },
  inputWrapError: { borderColor: Colors.brandCoral },
  textInput: {
    flex: 1,
    color: Colors.inkPrimary,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    paddingVertical: 10,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  charCount: {
    color: Colors.inkDisabled,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    alignSelf: "flex-end",
    paddingBottom: 6,
  },
  errorText: {
    color: Colors.brandCoral,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    marginTop: 4,
  },

  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  typeChipActive: {
    backgroundColor: "rgba(255,107,53,0.15)",
    borderColor: Colors.brandOrange,
  },
  typeEmoji: { fontSize: 16 },
  typeLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  typeLabelActive: { color: Colors.brandOrange },

  // Step 2
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    marginTop: 10,
    gap: 12,
  },
  pickerIcon: { width: 24, alignItems: "center" },
  pickerContent: { flex: 1 },
  pickerLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    marginBottom: 2,
  },
  pickerValue: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  pickerPlaceholder: { color: Colors.inkDisabled },
  timeRow: { flexDirection: "row", gap: 8, marginTop: 4 },

  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.brandOrange,
    minWidth: 60,
    textAlign: "center",
  },

  ageRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  ageChip: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: "center",
  },
  ageChipActive: {
    backgroundColor: "rgba(255,107,53,0.15)",
    borderColor: Colors.brandOrange,
  },
  ageText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 16,
    color: Colors.inkSecondary,
  },
  ageTextActive: { color: Colors.brandOrange },

  // Step 3
  step3Container: { flex: 1 },
  mapWrap: {
    height: 300,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  mapCentrePin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -32,
    marginLeft: -16,
  },
  locationNote: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 8,
    marginBottom: 12,
  },
  indiaBanner: {
    backgroundColor: "rgba(255,184,48,0.15)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accentGold,
    marginBottom: 12,
  },
  indiaBannerText: {
    color: Colors.accentGold,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
  },

  // Step 4
  pricingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
  },
  pricingToggle: { flexDirection: "row", gap: 8 },
  pricingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.elevated,
    alignItems: "center",
  },
  pricingBtnActive: { backgroundColor: Colors.brandOrange },
  pricingBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  pricingBtnTextActive: { color: "#fff" },
  currencySymbol: {
    color: Colors.inkSecondary,
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    marginRight: 4,
  },

  photosGrid: { flexDirection: "row", gap: 8, height: 200 },
  photoCoverSlot: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoSmallGrid: { width: (W - 48 - 8) / 3, gap: 6 },
  photoSmallSlot: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholder: { alignItems: "center", gap: 4 },
  photoPlaceholderText: {
    color: Colors.inkDisabled,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
  },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 3,
    zIndex: 10,
  },

  submitError: {
    backgroundColor: "rgba(255,56,100,0.15)",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.brandCoral,
  },
  submitErrorText: {
    color: Colors.brandCoral,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
  },

  bottomBar: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  nextBtn: { borderRadius: 16, overflow: "hidden" },
  nextGradient: { paddingVertical: 16, alignItems: "center" },
  nextText: {
    color: "#fff",
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
  },
});
