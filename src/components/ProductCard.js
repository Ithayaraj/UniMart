import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProductCard({ name, price }) {
    return (
        <View style={styles.card}>
            <Text style={styles.name}>{name}</Text>
            <Text>{price}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 15,
        borderWidth: 1,
        marginVertical: 5,
        borderRadius: 5
    },
    name: { fontWeight: 'bold' }
});
