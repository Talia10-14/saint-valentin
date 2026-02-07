# API Specification: L'Archéologie du Sentiment 🏺🌐

Architecture recommandée : **GraphQL** (pour la flexibilité des métadonnées 3D).

## 1. Discovery (Exploration)

### Query: `listMemories`
Récupère les "peluches-souvenirs" pour peupler l'univers 3D.
```graphql
query GetMemories($bound: BoxInput) {
  memories(location: $bound) {
    id
    name
    modelUrl      # URL du fichier .glb (draco compressed)
    emotionType   # "Joy", "Tenderness", "Glow"
    storySnippet  # Le "chuchotis" court
    position { x, y, z }
    scale
  }
}
```

## 2. Introspection (Détails)

### Query: `getMemoryDetails`
Appelé quand l'utilisateur "met en focus" une peluche.
```graphql
query GetDetails($id: ID!) {
  memory(id: $id) {
    id
    fullStory
    availableOptions {
      glowColors
      scentProfiles
      audioModuleEnabled
    }
  }
}
```

## 3. Capture (Conversion)

### Mutation: `initiateCapture`
Lance le processus de scellement et de paiement.
```graphql
mutation Capture($id: ID!, $config: CustomizationInput) {
  initiateCapture(memoryId: $id, config: $config) {
    orderSid
    stripeCheckoutUrl
    status # "Initiated"
  }
}
```

## 4. Webhooks & Fulfillment
- **Stripe Webhook**: `/api/webhooks/capture-success`
  - Déclenche l'envoi du pack "Magie" physique.
  - Sauvegarde le "Souvenir Scellé" dans le profil de l'utilisateur.
