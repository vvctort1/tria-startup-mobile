import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MOCK_VETS = [
  { id: '1', name: 'Dra. Ana Silva', specialty: 'Clínica Geral', rating: 4.8, avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: '2', name: 'Dr. Carlos Santos', specialty: 'Dermatologia', rating: 4.5, avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '3', name: 'Dra. Beatriz Costa', specialty: 'Ortopedia', rating: 3.8, avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: '4', name: 'Dr. Fernando Lima', specialty: 'Clínica Geral', rating: 4.2, avatar: 'https://randomuser.me/api/portraits/men/46.jpg' },
  { id: '5', name: 'Dra. Mariana Alves', specialty: 'Cardiologia', rating: 4.9, avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
  { id: '6', name: 'Dr. Ricardo Gomes', specialty: 'Comportamento', rating: 3.6, avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
  { id: '7', name: 'Dra. Paula Nunes', specialty: 'Nutrição', rating: 4.7, avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
];

const TAGS = ['Todos', 'Clínica Geral', 'Dermatologia', 'Ortopedia', 'Cardiologia', 'Nutrição', 'Comportamento'];

export function VetsScreen() {
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState('Todos');

  const filteredVets = MOCK_VETS.filter((vet) => {
    const matchesSearch = vet.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          vet.specialty.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesTag = selectedTag === 'Todos' || vet.specialty === selectedTag;
    
    return matchesSearch && matchesTag;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text>Logo TRIA</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Buscar veterinário ou especialidade..." 
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
        <View style={styles.tagRow}>
          {TAGS.map((tag) => (
            <TouchableOpacity 
              key={tag} 
              style={[styles.tag, selectedTag === tag && styles.tagSelected]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text style={selectedTag === tag ? styles.tagTextSelected : styles.tagText}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.list}>
        {filteredVets.length > 0 ? (
          filteredVets.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.vetCard}
              onPress={() => navigation.navigate('VetProfile', { vet: item })}
            >
              <View style={styles.vetInfoContainer}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View>
                  <Text style={styles.vetName}>{item.name}</Text>
                  <Text>{item.specialty}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: 'bold' }}>⭐ {item.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Nenhum veterinário encontrado.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 50
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  tagScroll: {
    flexGrow: 0,
    marginBottom: 15,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  tagSelected: {
    backgroundColor: '#002244',
    borderColor: '#002244',
  },
  tagText: {
    color: '#000',
  },
  tagTextSelected: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  vetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  vetInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  vetName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});