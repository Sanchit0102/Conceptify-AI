"""
ChromaDB vector store for semantic document search.
Uses sentence-transformers for embeddings.
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings

# Initialize ChromaDB persistent client
_client = None
_collection = None


def get_chroma_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=str(settings.chroma_path),
            settings=ChromaSettings(anonymized_telemetry=False)
        )
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name="department_resources",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_document(doc_id: str, text: str, metadata: dict = None):
    """Add a document to the vector store."""
    if not text or not text.strip():
        return
    collection = get_collection()
    # Chunk large documents
    chunks = chunk_text(text, max_chars=1000)
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [metadata or {} for _ in chunks]
    collection.add(documents=chunks, ids=ids, metadatas=metadatas)


def search(query: str, n_results: int = 5) -> list[dict]:
    """Search the vector store and return matching document chunks."""
    collection = get_collection()
    if collection.count() == 0:
        return []
    results = collection.query(query_texts=[query], n_results=min(n_results, collection.count()))
    output = []
    if results and results.get("documents"):
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results.get("metadatas") else {}
            distance = results["distances"][0][i] if results.get("distances") else 0
            output.append({
                "text": doc,
                "metadata": meta,
                "score": round(1 - distance, 4),
            })
    return output


def delete_document(doc_id: str):
    """Delete all chunks for a document from the vector store."""
    collection = get_collection()
    # Get all IDs matching the doc prefix
    try:
        existing = collection.get(where={"resource_id": doc_id})
        if existing and existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass


def chunk_text(text: str, max_chars: int = 1000) -> list[str]:
    """Split text into chunks of roughly max_chars size at paragraph boundaries."""
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current) + len(para) + 2 > max_chars and current:
            chunks.append(current.strip())
            current = para
        else:
            current = current + "\n\n" + para if current else para
    if current.strip():
        chunks.append(current.strip())
    return chunks if chunks else [text[:max_chars]] if text else []
