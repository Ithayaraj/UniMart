import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, ActivityIndicator, RefreshControl, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Carousel Component for Product Card
const ImageCarousel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);

    useEffect(() => {
        if (!images || images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = prevIndex === images.length - 1 ? 0 : prevIndex + 1;
                scrollViewRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
                return nextIndex;
            });
        }, 3000); // Change image every 3 seconds

        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) {
        return (
            <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={40} color="#ccc" />
            </View>
        );
    }

    return (
        <View style={styles.carouselContainer}>
            <FlatList
                ref={scrollViewRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                    <Image source={{ uri: item }} style={styles.cardImage} />
                )}
                onMomentumScrollEnd={(ev) => {
                    const newIndex = Math.round(ev.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(newIndex);
                }}
                getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
            />
            {images.length > 1 && (
                <View style={styles.dotsContainer}>
                    {images.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index ? styles.activeDot : styles.inactiveDot
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

export default function HomeScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchVisible, setSearchVisible] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
            setFilteredProducts(productsData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(product => 
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.contact?.includes(searchQuery)
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    const onRefresh = () => {
        setRefreshing(true);
        // The onSnapshot listener will automatically update the data
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
            activeOpacity={0.8}
        >
            <ImageCarousel images={item.images} />
            <View style={styles.cardContent}>
                <View style={styles.row}>
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.priceTag}>
                        <Text style={styles.productPrice}>Rs. {item.price}</Text>
                    </View>
                </View>
                {item.description && (
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={styles.metaRow}>
                    <View style={styles.contactRow}>
                        <Ionicons name="call" size={14} color="#0066cc" />
                        <Text style={styles.contactText}>{item.contact}</Text>
                    </View>
                    <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={14} color="#999" />
                        <Text style={styles.timeText}>
                            {item.createdAt?.seconds 
                                ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Just now'}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
            {/* Header */}
            <LinearGradient 
                colors={['#4A90E2', '#5BA3F5']} 
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerGreeting}>Discover</Text>
                        <Text style={styles.headerTitle}>UniMart</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.searchIconButton}
                        onPress={() => setSearchVisible(!searchVisible)}
                    >
                        <Ionicons 
                            name={searchVisible ? "close" : "search"} 
                            size={20} 
                            color="#fff" 
                        />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                {searchVisible && (
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </LinearGradient>

            {/* Products List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0066cc" />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={item => item.id}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0066cc']}
                            tintColor="#0066cc"
                            title="Pull to refresh"
                            titleColor="#666"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={80} color="#ddd" />
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? 'No results found' : 'No products yet'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {searchQuery 
                                    ? 'Try searching with different keywords' 
                                    : 'Be the first to post a product!'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1,
        backgroundColor: '#f5f7fa'
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f5f7fa'
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        fontWeight: '500'
    },
    header: {
        paddingTop: 25,
        paddingBottom: 12,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3
    },
    headerGreeting: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
        marginBottom: 1
    },
    headerTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#fff'
    },
    searchIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginTop: 15
    },
    searchIcon: {
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a1a',
        padding: 0
    },
    listContent: { 
        padding: 15, 
        paddingBottom: 100 
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    carouselContainer: { 
        height: 220, 
        width: '100%', 
        backgroundColor: '#f0f0f0' 
    },
    cardImage: { 
        width: width - 30, 
        height: 220, 
        resizeMode: 'cover' 
    },
    placeholderImage: { 
        width: '100%', 
        height: 220, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#e8e8e8' 
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 12,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dot: { 
        width: 7, 
        height: 7, 
        borderRadius: 4, 
        marginHorizontal: 4 
    },
    activeDot: { 
        backgroundColor: '#fff',
        width: 24
    },
    inactiveDot: { 
        backgroundColor: 'rgba(255,255,255,0.5)' 
    },
    cardContent: { 
        padding: 16 
    },
    row: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 8 
    },
    productName: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: '#1a1a1a', 
        flex: 1, 
        marginRight: 10 
    },
    priceTag: {
        backgroundColor: '#e7f8ed',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    productPrice: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#28a745'
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 10
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    contactRow: { 
        flexDirection: 'row', 
        alignItems: 'center',
        gap: 6
    },
    contactText: { 
        color: '#0066cc', 
        fontSize: 14,
        fontWeight: '600'
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    timeText: {
        color: '#999',
        fontSize: 12
    },
    emptyContainer: { 
        alignItems: 'center', 
        marginTop: 80,
        paddingHorizontal: 40
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 20,
        marginBottom: 8
    },
    emptyText: { 
        marginTop: 5, 
        color: '#999', 
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22
    }
});
