// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    server_protocol: 'http',
    server_host: 'localhost',
    server_port: '5000',
    colors: {
        graph_node_bounding_box: 'lime',
        graph_node_stroke: 'fuchsia',
        graph_node_stroke_popout: 'blue',
        graph_node_stroke_selection_preview: 'blue',
        graph_node_stroke_selected: 'lime',
        graph_node_fill_primary: 'lime',
        graph_node_fill_secondary: 'fuchsia',
        graph_edge_stroke: 'fuchsia',
        graph_edge_stroke_popout: 'blue',
        graph_edge_fill: 'pink',
        graph_edge_stroke_alt: 'green',
        graph_edge_stroke_popout_alt: 'orange',
        graph_edge_fill_alt: 'lime',
    },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
