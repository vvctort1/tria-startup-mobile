import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';

export function ConsultasScreen() {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'consultas'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const consultasData: any[] = [];
      querySnapshot.forEach((doc) => {
        consultasData.push({ id: doc.id, ...doc.data() });
      });
      setConsultas(consultasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Logo TRIA</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.sectionTitle}>Próximas consultas</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#002244" />
        ) : consultas.length > 0 ? (
          consultas.map((consulta) => (
            <View key={consulta.id} style={styles.card}>
              <View>
                <Text style={styles.vetName}>{consulta.vetName}</Text>
                <Text style={styles.detailsText}>{consulta.specialty}</Text>
                <Text style={styles.petText}>Pet: {consulta.petName}</Text>
              </View>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{consulta.date}</Text>
                <Text style={styles.timeText}>{consulta.time}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
            Nenhuma consulta agendada.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: { 
    alignItems: 'flex-end', 
    padding: 20, 
    paddingTop: 70, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderColor: '#eee' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  sectionTitle: { 
    marginBottom: 15, 
    fontWeight: 'bold', 
    fontSize: 18, 
    color: '#002244' 
  },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    elevation: 2 
  },
  vetName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  detailsText: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 2 
  },
  petText: { 
    fontSize: 14, 
    color: '#4a4a8a', 
    marginTop: 8, 
    fontWeight: '500' 
  },
  dateBadge: { 
    backgroundColor: '#eef2ff', 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  dateText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#002244' 
  },
  timeText: { 
    fontSize: 14, 
    color: '#6666ff', 
    fontWeight: 'bold', 
    marginTop: 2 
  }
});