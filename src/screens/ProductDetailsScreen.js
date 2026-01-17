import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert, Modal, Linking, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const { width, height } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
    const { product } = route.params;
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [fullImageVisible, setFullImageVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const { showToast } = useToast();
    const isOwner = auth.currentUser?.uid === product.userId;

    const handleScroll = (event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        setActiveImageIndex(roundIndex);
    };

    const handleDelete = () => {
        Alert.alert(
            "Mark as Sold / Delete",
            "Has this item been sold? This will permanently delete the product listing.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "products", product.id));
                            showToast("Product deleted successfully", "success");
                            navigation.goBack();
                        } catch (error) {
                            showToast("Error deleting product: " + error.message, "error");
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        navigation.navigate('EditProduct', { product });
    };

    const openFullImage = (index) => {
        setSelectedImageIndex(index);
        setFullImageVisible(true);
    };

    const handleCallSeller = () => {
        const phoneNumber = product.contact;
        if (!phoneNumber) {
            showToast('No contact number available', 'error');
            return;
        }

        const phoneUrl = Platform.OS === 'web' 
            ? `tel:${phoneNumber}`
            : `tel:${phoneNumber}`;

        Linking.canOpenURL(phoneUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(phoneUrl);
                } else {
                    showToast('Unable to open dialer', 'error');
                }
            })
            .catch((err) => {
                console.error('Error opening dialer:', err);
                showToast('Error opening dialer', 'error');
            });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Image Carousel */}
                <View style={styles.carouselContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {product.images && product.images.length > 0 ? (
                            product.images.map((img, index) => (
                                <TouchableOpacity key={index} onPress={() => openFullImage(index)} activeOpacity={0.9}>
                                    <Image source={{ uri: img }} style={styles.image} />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={[styles.image, styles.placeholderImage]}>
                                <Ionicons name="image-outline" size={50} color="#ccc" />
                                <Text style={{ color: '#ccc' }}>No Image</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Pagination Dots */}
                    {product.images && product.images.length > 1 && (
                        <View style={styles.pagination}>
                            {product.images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        activeImageIndex === index ? styles.activeDot : styles.inactiveDot
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Details Card */}
                <View style={styles.detailsContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{product.name}</Text>
                        <Text style={styles.price}>{product.price} LKR</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{product.description || 'No description provided.'}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Seller Contact</Text>
                        <TouchableOpacity style={styles.contactRow} onPress={handleCallSeller}>
                            <Ionicons name="call" size={20} color="#28a745" />
                            <Text style={[styles.contactText, styles.phoneNumber]}>{product.contact || 'N/A'}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#28a745" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                        <View style={styles.contactRow}>
                            <Ionicons name="person-circle-outline" size={20} color="#0066cc" />
                            <Text style={styles.contactText}>Posted by: {product.userEmail || 'Anonymous'}</Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Ionicons name="time-outline" size={20} color="#0066cc" />
                            <Text style={styles.contactText}>
                                {product.createdAt?.seconds
                                    ? new Date(product.createdAt.seconds * 1000).toLocaleDateString()
                                    : 'Recently'}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                {isOwner ? (
                    <View style={styles.ownerButtons}>
                        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
                            <Text style={styles.actionButtonText}>Sold / Delete</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.actionButton} onPress={handleCallSeller}>
                        <Ionicons name="call" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.actionButtonText}>Call Seller</Text>
                    </TouchableOpacity>
                )}
            </View>

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
                    >
                        {product.images && product.images.map((img, index) => (
                            <View key={index} style={styles.fullImageContainer}>
                                <Image 
                                    source={{ uri: img }} 
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 25,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    scrollContent: { paddingBottom: 100 },
    carouselContainer: { height: 300, position: 'relative' },
    image: { width: width, height: 300, resizeMode: 'cover' },
    placeholderImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1e1e1' },
    pagination: {
        position: 'absolute',
        bottom: 10,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
    activeDot: { backgroundColor: '#fff' },
    inactiveDot: { backgroundColor: 'rgba(255,255,255,0.5)' },
    detailsContainer: {
        marginTop: -20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        minHeight: 500
    },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', flex: 1, marginRight: 10 },
    price: { fontSize: 22, fontWeight: 'bold', color: '#28a745' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 10 },
    description: { fontSize: 16, color: '#444', lineHeight: 24 },
    contactRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 10,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#f8f9fa'
    },
    contactText: { fontSize: 16, color: '#333', marginLeft: 10 },
    phoneNumber: { 
        color: '#28a745', 
        fontWeight: '600',
        textDecorationLine: 'underline'
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    actionButton: {
        backgroundColor: '#0066cc',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    actionButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    ownerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#f0ad4e', // Orange for edit
        flexDirection: 'row',
        justifyContent: 'center',
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#d9534f', // Red for delete
        flexDirection: 'row',
        justifyContent: 'center',
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
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width,
        height: height * 0.8,
    }
});
