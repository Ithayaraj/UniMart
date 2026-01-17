import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { db, storage, auth } from '../firebaseConfig';
import { useToast } from '../context/ToastContext';

export default function EditProfileScreen({ navigation }) {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const { showToast } = useToast();
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setName(data.name || '');
                setMobile(data.mobile || '');
                setProfileImage(data.profileImage || null);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera roll permissions');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Pick image error:', error);
            showToast('Failed to pick image', 'error');
        }
    };

    const uploadImage = async (uri) => {
        try {
            // For web, use base64
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                const filename = `profiles/${userId}_${Date.now()}.jpg`;
                const storageRef = ref(storage, filename);
                
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);
                return downloadURL;
            }
            
            // For mobile, convert to blob
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `profiles/${userId}_${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);
            
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('Please enter your name', 'error');
            return;
        }

        if (mobile && !/^\d{10}$/.test(mobile.replace(/\s/g, ''))) {
            showToast('Please enter a valid 10-digit mobile number', 'error');
            return;
        }

        setLoading(true);
        try {
            let imageUrl = profileImage;

            // Upload new image if it's a local URI (not already uploaded)
            if (profileImage && (profileImage.startsWith('file://') || profileImage.startsWith('blob:') || (!profileImage.startsWith('http') && !profileImage.startsWith('https')))) {
                try {
                    console.log('Uploading image...');
                    imageUrl = await uploadImage(profileImage);
                    console.log('Image uploaded successfully:', imageUrl);
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    
                    // Check if it's a permission error
                    if (uploadError.code === 'storage/unauthorized') {
                        Alert.alert(
                            'Storage Permission Error',
                            'Firebase Storage rules need to be updated. Please check FIREBASE_STORAGE_RULES.txt file in the project root for instructions.\n\nWould you like to save your profile without the image?',
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => {
                                        setLoading(false);
                                        return;
                                    }
                                },
                                {
                                    text: 'Save Without Image',
                                    onPress: async () => {
                                        await saveProfile(null);
                                    }
                                }
                            ]
                        );
                    } else {
                        // Other upload errors
                        Alert.alert(
                            'Image Upload Failed',
                            'Would you like to save your profile without the image?',
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => {
                                        setLoading(false);
                                        return;
                                    }
                                },
                                {
                                    text: 'Save Without Image',
                                    onPress: async () => {
                                        await saveProfile(null);
                                    }
                                }
                            ]
                        );
                    }
                    return;
                }
            }

            await saveProfile(imageUrl);
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Failed to update profile: ' + error.message, 'error');
            setLoading(false);
        }
    };

    const saveProfile = async (imageUrl) => {
        try {
            const userDoc = {
                name: name.trim(),
                mobile: mobile.trim(),
                email: auth.currentUser?.email,
                updatedAt: new Date()
            };

            // Only add profileImage if we have a valid URL
            if (imageUrl) {
                userDoc.profileImage = imageUrl;
            }

            await setDoc(doc(db, 'users', userId), userDoc, { merge: true });
            showToast('Profile updated successfully', 'success');
            setLoading(false);
            navigation.goBack();
        } catch (error) {
            throw error;
        }
    };

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Profile Image */}
                    <View style={styles.imageSection}>
                        <TouchableOpacity 
                            style={styles.imageContainer}
                            onPress={pickImage}
                        >
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Ionicons name="person" size={60} color="#ccc" />
                                </View>
                            )}
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera" size={20} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.imageHint}>Tap to change photo</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mobile Number</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter mobile number"
                                    value={mobile}
                                    onChangeText={setMobile}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={[styles.inputContainer, styles.disabledInput]}>
                                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                                <Text style={styles.disabledText}>
                                    {auth.currentUser?.email}
                                </Text>
                            </View>
                            <Text style={styles.hint}>Email cannot be changed</Text>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity 
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { padding: 20 },
    imageSection: { alignItems: 'center', marginBottom: 30 },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        marginBottom: 10
    },
    profileImage: { width: '100%', height: '100%' },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e8e8e8',
        justifyContent: 'center',
        alignItems: 'center'
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff'
    },
    imageHint: { fontSize: 14, color: '#666', marginTop: 5 },
    form: { marginBottom: 20 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#333'
    },
    disabledInput: { backgroundColor: '#f8f8f8' },
    disabledText: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#999'
    },
    hint: { fontSize: 12, color: '#999', marginTop: 5 },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#4A90E2',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: "#4A90E2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10
    }
});
