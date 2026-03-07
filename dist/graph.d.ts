/**
 * Graph and link analysis — pure functions.
 */
import { type PageInfo } from './types.js';
export interface GraphNode {
    id: string;
    title: string;
    count: number;
}
export interface GraphEdge {
    source: string;
    target: string;
}
export interface GraphData {
    nodes: GraphNode[];
    links: GraphEdge[];
}
export declare function extractWikilinks(content: string): string[];
export declare function buildGraph(pages: Map<string, PageInfo>): GraphData;
export declare function buildBacklinks(pages: Map<string, PageInfo>): Map<string, string[]>;
