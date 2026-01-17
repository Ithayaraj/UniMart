import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Platform, Modal, Dimensions, KeyboardAvoidingView } from 'react-native';
import { useToast } from '../context/ToastContext';
import * as ImagePicker from 'expo-image-picker';
import { db, storage, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EditProductScreen({ route, navigation }) {
    const { product } = route.params;
    const [name, setName] = useState(product.name || '');
    const [price, setPrice] = useState(product.price?.toString() || '');
    const [description, setDescription] = useState(product.description || '');
    const [contact, setContact] = useState(product.contact || '');
    const [images, setImages] = useState(product.images || []);
    const [uploading, setUploading] = useState(false);
    const [fullImageVisible, setFullImageVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const { showToast } = useToast();

    // Track old images to know what's already uploaded (URL string) vs new (URI string)
    // Simple check: if it starts with 'http', it's existing.

    const pickImage = async () => {
        if (images.length >= 3) {
            showToast('Maximum 3 images allowed', 'error');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0]]);
        }
    };

    const removeImage = (index) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const uploadImage = async (imageAsset) => {
        try {
            const uri = imageAsset.uri || imageAsset;
            if (typeof uri === 'string' && uri.startsWith('http')) return uri; // Already uploaded

            const userId = auth.currentUser?.uid || 'anonymous';
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const filename = `products/${userId}/${timestamp}_${randomStr}.jpg`;
            const storageRef = ref(storage, filename);

            console.log('Uploading image:', filename);

            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();

                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                await uploadString(storageRef, dataUrl, 'data_url');
            } else {
                const blob = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.onload = function () {
                        resolve(xhr.response);
                    };
                    xhr.onerror = function (e) {
                        console.error('XHR Error:', e);
                        reject(new TypeError("Network request failed"));
                    };
                    xhr.responseType = "blob";
                    xhr.open("GET", uri, true);
                    xhr.send(null);
                });
                
                await uploadBytes(storageRef, blob);
                
                if (blob.close) {
                    blob.close();
                }
            }

            const downloadURL = await getDownloadURL(storageRef);
            console.log('Image uploaded successfully:', downloadURL);
            return downloadURL;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handleUpdateProduct = async () => {
        // Validate all fields
        const errors = [];
        
        if (!name.trim()) {
            errors.push('Product name is required');
        }
        
        if (!price.trim()) {
            errors.push('Price is required');
        } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            errors.push('Please enter a valid price');
        }
        
        if (!contact.trim()) {
            errors.push('Contact number is required');
        } else if (contact.trim().length < 10) {
            errors.push('Please enter a valid contact number');
        }
        
        if (images.length === 0) {
            errors.push('At least one image is required');
        }

        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }

        setUploading(true);
        try {
            console.log('Updating product...');
            
            // Upload new images
            const imageUrls = await Promise.all(
                images.map((img, index) => {
                    console.log(`Processing image ${index + 1}/${images.length}`);
                    return uploadImage(img);
                })
            );

            console.log('All images processed, updating Firestore...');

            // Update Firestore
            const productRef = doc(db, 'products', product.id);
            await updateDoc(productRef, {
                name: name.trim(),
                price: parseFloat(price),
                description: description.trim(),
                contact: contact.trim(),
                images: imageUrls,
            });

            console.log('Product updated successfully');
            showToast('Product updated successfully!', 'success');
            
            // Navigate back to home and refresh
            navigation.navigate('Main', { screen: 'Home' });
        } catch (error) {
            console.error('Update error:', error);
            
            let errorMessage = 'Failed to update product: ';
            
            if (error.code === 'permission-denied') {
                errorMessage += 'Permission denied. Check Firestore rules.';
            } else if (error.message.includes('Storage')) {
                errorMessage += error.message;
            } else if (error.message.includes('network')) {
                errorMessage += 'Network error. Check your connection.';
            } else {
                errorMessage += error.message || 'Unknown error occurred';
            }
            
            showToast(errorMessage, 'error');
        } finally {
            setUploading(false);
        }
    };

    const openFullImage = (index) => {
        setSelectedImageIndex(index);
        setFullImageVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Product</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Images Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Product Images</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.imageScrollView}
                        keyboardShouldPersistTaps="handled"
                    >
                        {images.map((img, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <TouchableOpacity onPress={() => openFullImage(index)} activeOpacity={0.8}>
                                    <Image source={{ uri: img.uri || img }} style={styles.previewImage} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.removeBtn} 
                                    onPress={() => removeImage(index)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close-circle" size={28} color="#ff3b30" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {images.length < 3 && (
                            <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
                                <Ionicons name="camera-outline" size={32} color="#0066cc" />
                                <Text style={styles.addBtnText}>Add Photo</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                    <Text style={styles.hint}>
                        <Ionicons name="information-circle-outline" size={14} color="#666" /> 
                        {' '}Add up to 3 photos • Tap to view full size
                    </Text>
                </View>

                {/* Product Details */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Product Details</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Product Name *</Text>
                        <TextInput 
                            placeholder="e.g., iPhone 13 Pro" 
                            style={styles.input} 
                            value={name} 
                            onChangeText={setName}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Price (LKR) *</Text>
                        <View style={styles.priceInputWrapper}>
                            <Text style={styles.currencySymbol}>Rs.</Text>
                            <TextInput 
                                placeholder="0.00" 
                                style={[styles.input, styles.priceInput]} 
                                value={price} 
                                onChangeText={setPrice} 
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contact Number *</Text>
                        <View style={styles.phoneInputWrapper}>
                            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput 
                                placeholder="07X XXX XXXX" 
                                style={[styles.input, styles.phoneInput]} 
                                value={contact} 
                                onChangeText={setContact} 
                                keyboardType="phone-pad"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            placeholder="Describe your product, condition, features..."
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                {/* Seller Info */}
                <View style={styles.infoCard}>
                    <Ionicons name="person-circle-outline" size={20} color="#0066cc" />
                    <Text style={styles.infoText}>Posted by: {product.userEmail || 'You'}</Text>
                </View>

                {/* Update Button */}
                {uploading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0066cc" />
                        <Text style={styles.loadingText}>Updating product...</Text>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.submitBtn} 
                        onPress={handleUpdateProduct}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                        <Text style={styles.submitBtnText}>Update Product</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Full Image Modal */}
            <Modal
                visible={fullImageVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFullImageVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity 
                        style={styles.modalCloseButton} 
                        onPress={() => setFullImageVisible(false)}
                    >
                        <Ionicons name="close-circle" size={40} color="#fff" />
                    </TouchableOpacity>
                    
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentOffset={{ x: selectedImageIndex * width, y: 0 }}
                        scrollEnabled={true}
                    >
                        {images.map((img, index) => (
                            <View key={index} style={styles.fullImageContainer}>
                                <ScrollView
                                    contentContainerStyle={styles.fullImageScrollContent}
                                    maximumZoomScale={3}
                                    minimumZoomScale={1}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Image 
                                        source={{ uri: img.uri || img }} 
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                </ScrollView>
                            </View>
                        ))}
                    </ScrollView>
                    
                    {images.length > 1 && (
                        <View style={styles.imageCounter}>
                            <Text style={styles.imageCounterText}>
                                {selectedImageIndex + 1} / {images.length}
                            </Text>
                        </View>
                    )}
                </View>
            </Modal>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f7fa' 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 25,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e4e8',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: { 
        padding: 5 
    },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#1a1a1a' 
    },
    scrollContent: { 
        padding: 20,
        paddingBottom: 40 
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: '#1a1a1a',
        marginBottom: 15 
    },
    imageScrollView: {
        marginBottom: 10
    },
    imageWrapper: { 
        marginRight: 12, 
        position: 'relative' 
    },
    previewImage: { 
        width: 110, 
        height: 110, 
        borderRadius: 12,
        backgroundColor: '#f0f0f0'
    },
    removeBtn: { 
        position: 'absolute', 
        top: -8, 
        right: -8, 
        backgroundColor: '#fff', 
        borderRadius: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    addBtn: {
        width: 110,
        height: 110,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#0066cc',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f7ff'
    },
    addBtnText: { 
        fontSize: 13, 
        color: '#0066cc', 
        marginTop: 6,
        fontWeight: '600'
    },
    hint: { 
        fontSize: 13, 
        color: '#666', 
        fontStyle: 'italic' 
    },
    inputGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    input: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e1e4e8',
        color: '#1a1a1a'
    },
    priceInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e4e8',
        paddingLeft: 15
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: '#28a745',
        marginRight: 5
    },
    priceInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
        paddingLeft: 5
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e4e8',
        paddingLeft: 15
    },
    inputIcon: {
        marginRight: 8
    },
    phoneInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0
    },
    textArea: { 
        height: 120, 
        textAlignVertical: 'top',
        paddingTop: 15
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e7f3ff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20
    },
    infoText: {
        fontSize: 14,
        color: '#0066cc',
        marginLeft: 10,
        fontWeight: '500'
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },
    submitBtn: {
        backgroundColor: '#f0ad4e',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: "#f0ad4e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    submitBtnText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold',
        marginLeft: 8
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    fullImageContainer: {
        width: width,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImageScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width,
        height: width,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    imageCounterText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
