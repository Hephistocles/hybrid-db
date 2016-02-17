(defn- ensure-node [graph id]
    (let [g @(:atomref graph)]
         (if-let [node ((:vertices g) id)] ; If node already in our loaded graph just return graph
                 g
                 ; else load a new portion of graph via node-load
                 (let [{nodes :n node-edges :e} ((:node-load graph) id)
                       insertions               (atom #{})]

                       ; Add the vertices to our graph
                       (doseq [{:keys [id props]} nodes]
                          ; If this vertex is not currently in the graph, add it
                          (when-not ((:vertices @(:atomref g)) id)
                            (add-node graph id props)
                            ; Keep track of newly inserted vertices
                            (swap! insertions conj id)))

                        ; Add the edges to our graph
                       (doseq [{:keys [from to label props]} node-edges]
                          #_(println "Adding edge " from "--" label "-->" to)
                          ; If either end of this edge is new, add the edge
                          (when (or (get @insertions from) (get @insertions to))
                             (add-edge graph from label to props)))

                       ; Return the updated graph
                       @(:atomref graph)))))
