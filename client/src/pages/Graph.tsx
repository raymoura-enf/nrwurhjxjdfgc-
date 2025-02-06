import { useCallback, useMemo, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  type Node,
  type Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { Note, Connection } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 100,
      y: nodeWithPosition.y - 25,
    };

    // Enhanced node styling
    node.style = {
      background: '#1a1a1a',
      color: '#fff',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      width: 200,
    };
  });

  return { nodes, edges };
};

export default function Graph() {
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    source: string;
    target: string;
  } | null>(null);
  const [connectionLabel, setConnectionLabel] = useState('');

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });

  const createConnection = useMutation({
    mutationFn: async ({ source, target, label }: { source: string; target: string; label?: string }) => {
      await apiRequest("POST", "/api/connections", {
        sourceId: parseInt(source),
        targetId: parseInt(target),
        label,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      setIsLabelDialogOpen(false);
      setPendingConnection(null);
      setConnectionLabel('');
    },
  });

  const initialNodes: Node[] = useMemo(() => notes.map((note) => ({
    id: note.id.toString(),
    data: { label: note.content },
    position: { x: 0, y: 0 },
    type: 'default',
  })), [notes]);

  const initialEdges: Edge[] = useMemo(() => connections.map((conn) => ({
    id: conn.id.toString(),
    source: conn.sourceId.toString(),
    target: conn.targetId.toString(),
    label: conn.label || (conn.isAiGenerated ? `AI: ${conn.relation}` : ''),
    type: 'smoothstep',
    animated: conn.isAiGenerated,
    style: {
      strokeWidth: 2,
      stroke: conn.isAiGenerated ? '#9333ea' : '#64748b',
      strokeDasharray: conn.isAiGenerated ? '5 5' : undefined,
    },
    labelStyle: {
      fill: conn.isAiGenerated ? '#9333ea' : '#64748b',
      fontSize: 12,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: conn.isAiGenerated ? '#9333ea' : '#64748b',
    },
  })), [connections]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: any) => {
      if (params.source && params.target) {
        setPendingConnection(params);
        setIsLabelDialogOpen(true);
      }
    },
    []
  );

  const handleCreateConnection = () => {
    if (pendingConnection) {
      createConnection.mutate({
        source: pendingConnection.source,
        target: pendingConnection.target,
        label: connectionLabel,
      });
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-8rem)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-background"
        >
          <Background />
          <Controls />
          <Panel position="top-left" className="bg-background/90 p-4 rounded-lg backdrop-blur-sm border">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#9333ea]" />
                <span>AI-detected connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#64748b]" />
                <span>User-created connection</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Connection Label</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Enter connection label (optional)"
              value={connectionLabel}
              onChange={(e) => setConnectionLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateConnection();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsLabelDialogOpen(false);
                setPendingConnection(null);
                setConnectionLabel('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateConnection}>
              Create Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}