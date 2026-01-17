import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';

export default function MyProductsScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const q = query(
            collection(db, 'products'),
            where('userId', '==', auth.currentUser?.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = (productId) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'products', productId));
                            showToast('Product deleted successfully', 'success');
                        } catch (error) {
                            showToast('Failed to delete product', 'error');
                        }
                    }
                }
            ]
        );
    };

    const renderProduct = ({ item }) => (
        <View style={styles.card}>
            <Image 
                source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }} 
                style={styles.image} 
            />
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>Rs. {item.price}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditProduct', { product: item })}
                >
                    <Ionicons name="create-outline" size={20} color="#4A90E2" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Products</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item.id}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="bag-outline" size={80} color="#ddd" />
                            <Text style={styles.emptyText}>No products yet</Text>
                            <TouchableOpacity 
                                style={styles.addButton}
                                onPress={() => navigation.navigate('AddProduct')}
                            >
                                <Text style={styles.addButtonText}>Add Product</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
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
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    image: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f0f0f0' },
    content: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    name: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
    price: { fontSize: 15, fontWeight: 'bold', color: '#28a745', marginBottom: 4 },
    description: { fontSize: 13, color: '#666' },
    actions: { justifyContent: 'center', gap: 8 },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff0f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, color: '#999', marginTop: 20, marginBottom: 20 },
    addButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10
    },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
