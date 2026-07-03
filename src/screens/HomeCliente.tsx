import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, Platform, ActivityIndicator, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import ProfileScreen from "./ProfileScreen";
import BottomNavBar, { TabItem } from "./BottomNavBar";
import ExploreTab from "../components/ExploreTab";
import api from "../services/api";

export default function HomeCliente({ route, navigation }: any) {
  const { user: initialUser } = route.params || {};
  const [user, setUser] = useState(initialUser || { name: "Cliente", role: "client" });
  const [activeTab, setActiveTab] = useState("explorar");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const TABS_NAMES: Record<string, string> = {
    "perfil": "Mi Perfil",
    "turnos": "Mis Turnos",
    "explorar": "Explorar"
  };

  useEffect(() => {
    if (activeTab === "turnos") {
      fetchAppointments();
    }
  }, [activeTab]);

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const response = await api.get("/appointments");
      const list = response.data || [];
      // Sort by updated_at desc (last update date)
      list.sort((a: any, b: any) => {
        const dateA = new Date(a.updated_at);
        const dateB = new Date(b.updated_at);
        return dateB.getTime() - dateA.getTime();
      });
      setAppointments(list);
    } catch (error) {
      console.error("Error fetching appointments in HomeCliente:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const getFilteredAppointments = () => {
    if (statusFilter === "todos") return appointments;
    if (statusFilter === "cancelled_rejected") {
      return appointments.filter(app => app.status === "cancelled" || app.status === "rejected");
    }
    return appointments.filter(app => app.status === statusFilter);
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const parts = dateStr.split('-');
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      const date = new Date(year, month, day);

      const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const MONTH_NAMES = [
        "ene", "feb", "mar", "abr", "may", "jun",
        "jul", "ago", "sep", "oct", "nov", "dic"
      ];
      const dayName = DAYS_OF_WEEK[date.getDay()];
      const monthName = MONTH_NAMES[date.getMonth()];
      const cleanTime = timeStr.substring(0, 5);

      return `${dayName}, ${day} de ${monthName} - ${cleanTime} hs`;
    } catch (e) {
      return `${dateStr} a las ${timeStr}`;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return { bg: '#c2f0d9', border: '#a7f3d0', text: '#00694c', label: 'Confirmado' };
      case 'pending':
        return { bg: '#fffbeb', border: '#fef3c7', text: '#d97706', label: 'Pendiente' };
      case 'completed':
        return { bg: '#e0f2fe', border: '#bae6fd', text: '#0369a1', label: 'Completado' };
      case 'rejected':
        return { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', label: 'Rechazado' };
      case 'cancelled':
        return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563', label: 'Cancelado' };
      default:
        return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563', label: status };
    }
  };

  const FILTER_OPTIONS = [
    { key: "todos", label: "Todos" },
    { key: "pending", label: "Pendientes" },
    { key: "accepted", label: "Confirmados" },
    { key: "completed", label: "Completados" },
    { key: "cancelled_rejected", label: "Cancelados/Rechazados" },
  ];

  const handleLogout = async () => {
    try {
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión");
    }
  };

  const clientTabs: TabItem[] = [
    { key: "explorar", label: "Explorar", icon: "search" },
    { key: "turnos", label: "Turnos", icon: "schedule" },
    { key: "perfil", label: "Perfil", icon: "person" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "explorar":
        return <ExploreTab />;
      case "turnos":
        const filtered = getFilteredAppointments();
        return (
          <View style={styles.tabContentTurnos}>
            {/* Dropdown Filter */}
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity 
                style={styles.dropdownHeader} 
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <View style={styles.dropdownHeaderLeft}>
                  <Feather name="filter" size={16} color="#008560" style={{ marginRight: 8 }} />
                  <Text style={styles.dropdownHeaderText}>
                    Filtrar por: {FILTER_OPTIONS.find(opt => opt.key === statusFilter)?.label || "Todos"}
                  </Text>
                </View>
                <Feather name={dropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#707d76" />
              </TouchableOpacity>

              {dropdownOpen && (
                <View style={styles.dropdownList}>
                  {FILTER_OPTIONS.map((opt) => {
                    const isSelected = statusFilter === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setStatusFilter(opt.key);
                          setDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected
                        ]}>
                          {opt.label}
                        </Text>
                        {isSelected && (
                          <Feather name="check" size={16} color="#008560" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {loadingAppointments ? (
              <ActivityIndicator size="large" color="#008560" style={{ marginTop: 40 }} />
            ) : filtered.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="schedule" size={64} color="#707d76" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>Sin turnos</Text>
                <Text style={styles.emptySubtitle}>
                  No tenés turnos con el estado seleccionado en este momento.
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.appointmentsScroll} 
                contentContainerStyle={styles.appointmentsScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {filtered.map((item) => {
                  const profUser = item.professional_profile?.user || {};
                  const service = item.service || {};
                  const badge = getStatusBadgeStyle(item.status);

                  return (
                    <View key={item.id} style={styles.turnoCard}>
                      <View style={styles.turnoImageContainer}>
                        {profUser.avatar_url ? (
                          <Image source={{ uri: profUser.avatar_url }} style={styles.turnoImage} />
                        ) : (
                          <View style={styles.turnoAvatarPlaceholder}>
                            <Feather name="user" size={24} color="#008560" />
                          </View>
                        )}
                      </View>

                      <View style={styles.turnoInfo}>
                        <Text style={styles.turnoService}>{service.name || "Servicio"}</Text>
                        <Text style={styles.turnoProfessional}>con {profUser.name || "Profesional"}</Text>
                        
                        <View style={styles.turnoTimeRow}>
                          <MaterialIcons name="event" size={14} color="#707d76" />
                          <Text style={styles.turnoTimeText}>
                            {formatDateTime(item.date, item.start_time)}
                          </Text>
                        </View>

                        <View style={[
                          styles.turnoBadge,
                          { backgroundColor: badge.bg, borderColor: badge.border, borderWidth: 1 }
                        ]}>
                          <Text style={[styles.turnoBadgeText, { color: badge.text }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        );
      case "perfil":
        return (
          <ProfileScreen
            user={user}
            onUpdateUser={setUser}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />

      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.logo, { color: '#008560' }]}>{TABS_NAMES[activeTab] || "alToque"}</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("Solicitudes", { user })}
        >
          <View>
            <Feather name="bell" size={24} color="#3d4943" />
            <View style={styles.notificationDot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      {/* Bottom Navigation */}
      <BottomNavBar
        tabs={clientTabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: "#f7faf8",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e9e7",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#181c1c",
    textAlign: "center",
    flex: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e11d48',
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingBottom: 100, // Safe space for bottom tab bar
  },
  welcomeCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bccac1",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#181c1c",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#3d4943",
    textAlign: "center",
    lineHeight: 22,
  },
  placeholderCard: {
    alignItems: "center",
    padding: 24,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#181c1c",
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: "#3d4943",
    textAlign: "center",
    lineHeight: 22,
  },
  tabContentTurnos: {
    flex: 1,
    width: "100%",
  },
  dropdownWrapper: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6e9e7",
    zIndex: 10,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  dropdownHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#181c1c",
  },
  dropdownList: {
    borderTopWidth: 1,
    borderTopColor: "#e6e9e7",
    backgroundColor: "#fafafa",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f2f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#ebefed",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#3d4943",
  },
  dropdownItemTextSelected: {
    fontWeight: "bold",
    color: "#008560",
  },
  appointmentsScroll: {
    flex: 1,
  },
  appointmentsScrollContent: {
    padding: 16,
    paddingBottom: 100, // Safe space above bottom tab bar
    gap: 12,
  },
  turnoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6e9e7",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  turnoImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#ebefed",
  },
  turnoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  turnoAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c2f0d9",
  },
  turnoInfo: {
    flex: 1,
  },
  turnoService: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#181c1c",
  },
  turnoProfessional: {
    fontSize: 13,
    color: "#707d76",
    marginTop: 2,
  },
  turnoTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  turnoTimeText: {
    fontSize: 12,
    color: "#3d4943",
  },
  turnoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
  },
  turnoBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#181c1c",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#707d76",
    textAlign: "center",
  },
});
