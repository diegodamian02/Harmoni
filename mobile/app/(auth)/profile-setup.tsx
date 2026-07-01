import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { GradientButton } from '../../src/components/GradientButton';
import { TextInput } from '../../src/components/TextInput';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';
import { Colors } from '../../src/theme/colors';
import { FontFamily, FontSize } from '../../src/theme/typography';

const GENDERS = ['Male', 'Female', 'Non-Binary', 'Other'];
const STEPS = ['About You', 'Your Photos'];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0);

  // Step 0 fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');

  // Step 1 fields
  const [photos, setPhotos] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    if (photos.length >= 6) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 0) {
      if (!name || !age || !gender) {
        setError('Please fill in all fields.');
        return;
      }
      if (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) {
        setError('Please enter a valid age (18+).');
        return;
      }
      setError('');
      setStep(1);
    }
  };

  const handleFinish = async () => {
    if (photos.length === 0) {
      setError('Please add at least one photo.');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('age', age);
    formData.append('gender', gender);
    formData.append('bio', bio);
    photos.forEach((uri, i) => {
      formData.append('photos', {
        uri,
        name: `photo_${i}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

    try {
      await api.post('/user/profile', formData);
      await refreshUser();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.stepDot, i === step && styles.stepDotActive]} />
        ))}
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.title}>{STEPS[step]}</Text>

              {step === 0 && (
                <>
                  <TextInput placeholder="Your Name" value={name} onChangeText={setName} />
                  <TextInput
                    placeholder="Your Age"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.genderRow}>
                    {GENDERS.map((g) => (
                      <Pressable
                        key={g}
                        style={[styles.genderChip, gender === g && styles.genderChipSelected]}
                        onPress={() => setGender(g)}
                      >
                        <Text
                          style={[
                            styles.genderChipText,
                            gender === g && styles.genderChipTextSelected,
                          ]}
                        >
                          {g}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <TextInput
                    placeholder="Short bio (optional)"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={3}
                    style={{ height: 80, textAlignVertical: 'top' }}
                  />

                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <GradientButton label="Next →" onPress={handleNext} />
                </>
              )}

              {step === 1 && (
                <>
                  <Text style={styles.photoHint}>Add up to 6 photos. First photo is your main.</Text>
                  <View style={styles.photoGrid}>
                    {photos.map((uri, i) => (
                      <View key={i} style={styles.photoWrapper}>
                        <Image source={{ uri }} style={styles.photo} />
                        <Pressable style={styles.removePhoto} onPress={() => removePhoto(i)}>
                          <Text style={styles.removePhotoText}>✕</Text>
                        </Pressable>
                      </View>
                    ))}
                    {photos.length < 6 && (
                      <Pressable style={styles.addPhoto} onPress={pickPhoto}>
                        <Text style={styles.addPhotoText}>+</Text>
                      </Pressable>
                    )}
                  </View>

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <Pressable onPress={() => setStep(0)} style={styles.backLink}>
                    <Text style={styles.backLinkText}>← Back</Text>
                  </Pressable>

                  <GradientButton
                    label={loading ? 'Setting up...' : 'Start Swiping 🎵'}
                    onPress={handleFinish}
                    disabled={loading}
                  />
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  stepDotActive: {
    backgroundColor: Colors.white,
    width: 24,
  },
  inner: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semiBold,
    color: Colors.textDark,
    marginBottom: 16,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  genderChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
  },
  genderChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  genderChipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textDark,
  },
  genderChipTextSelected: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  photoHint: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  photoWrapper: {
    width: 100,
    height: 134,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
  },
  addPhoto: {
    width: 100,
    height: 134,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 40,
    color: Colors.textSecondary,
    lineHeight: 44,
  },
  error: {
    color: Colors.dislike,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    marginTop: 4,
    textAlign: 'center',
  },
  backLink: { marginTop: 12 },
  backLinkText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});
