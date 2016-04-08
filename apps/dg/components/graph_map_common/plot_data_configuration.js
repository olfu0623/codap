// ==========================================================================
//                      DG.PlotDataConfiguration
//
//  Author:   William Finzer
//
//  Copyright ©2014 Concord Consortium
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ==========================================================================

/** @class  DG.PlotDataConfiguration - The object that describes the manner in which attributes are
    assigned to places in a graph.

  @extends SC.Object
*/
DG.PlotDataConfiguration = SC.Object.extend(
/** @scope DG.PlotDataConfiguration.prototype */ 
{
  /**
    The data context which is the source of the data for this graph.
    @property   {DG.DataContext}
   */
  dataContext: null,

  dataContextDidChange: function() {
    this.invalidateCaches();
  }.observes('dataContext'),
  
  /**
    The outer array is indexed by DG.GraphTypes.EPlace
    @property { Array of {Array of {DG.AttributeDescription}}}
  */
  attributesByPlace: null,

  /**
    @property { DG.CollectionClient }
  */
  collectionClient: function() {
    var tResult = (this.chooseChildCollection( this.get('xCollectionClient'), this.get('yCollectionClient')) ||
                    this.get('legendCollectionClient'));
    if( !tResult) {
      // We first try for the child collection
      tResult = this.getPath( 'dataContext.childCollection');
      // But if it has zero cases we'll settle for the parent collection
      if( tResult && tResult.getPath('casesController.arrangedObjects').length() === 0) {
        tResult = this.getPath( 'dataContext.parentCollection');
      }
    }
    return tResult;
  }.property('xCollectionClient','yCollectionClient', 'legendCollectionClient', 'dataContext'),
  
  xCollectionClient: function() {
    return this.getPath('xAttributeDescription.collectionClient');
  }.property(),
  
  yCollectionClient: function() {
    return this.getPath('yAttributeDescription.collectionClient');
  }.property(),
  
  y2CollectionClient: function() {
    return this.getPath('y2AttributeDescription.collectionClient');
  }.property(),

  legendCollectionClient: function() {
    return this.getPath('legendAttributeDescription.collectionClient');
  }.property(),

  xCollectionDidChange: function() {
    this.notifyPropertyChange('xCollectionClient');
  }.observes('*xAttributeDescription.collectionClient'),
  
  yCollectionDidChange: function() {
    this.notifyPropertyChange('yCollectionClient');
  }.observes('*yAttributeDescription.collectionClient'),
  
  y2CollectionDidChange: function() {
    this.notifyPropertyChange('y2CollectionClient');
  }.observes('*y2AttributeDescription.collectionClient'),

  legendCollectionDidChange: function() {
    this.notifyPropertyChange('legendCollectionClient');
  }.observes('*legendAttributeDescription.collectionClient'),

  /**
   * @property {String}
   */
  defaultTitle: function() {
    var tTitle = this.getPath('collectionClient.name');
    tTitle = SC.empty( tTitle) ? 'DG.DataContext.noData'.loc() : tTitle;
    return tTitle;
  }.property( 'dataContext'),

  /**
    @property { DG.AttributePlacementDescription }
  */
  xAttributeDescription: function( iKey, iValue) {
    return this.attributeDescriptionForPlace( iKey, iValue, DG.GraphTypes.EPlace.eX);
  }.property(),

  /**
    @property { DG.AttributePlacementDescription }
  */
  yAttributeDescription: function( iKey, iValue) {
    return this.attributeDescriptionForPlace( iKey, iValue, DG.GraphTypes.EPlace.eY);
  }.property(),

  /**
    @property { DG.AttributePlacementDescription }
  */
  y2AttributeDescription: function( iKey, iValue) {
    return this.attributeDescriptionForPlace( iKey, iValue, DG.GraphTypes.EPlace.eY2);
  }.property(),

  /**
    @property { DG.AttributePlacementDescription }
  */
  legendAttributeDescription: function( iKey, iValue) {
    return this.attributeDescriptionForPlace( iKey, iValue, DG.GraphTypes.EPlace.eLegend);
  }.property(),

  /**
    @property { DG.AttributePlacementDescription }
  */
  attributeDescriptionForPlace: function( iKey, iValue, iPlace) {
    if( iValue) {
      DG.assert( iValue instanceof DG.AttributePlacementDescription);
      this.attributesByPlace[ iPlace][0] = iValue;
      iValue.addObserver('collection', this, 'collectionDidChange');
    }

    return !SC.none( this.attributesByPlace) ?
              this.attributesByPlace[ iPlace][0] : null;
  }.property(),

  /**
   * One of my attributeDescription's attribute's collections has changed.
   * We look up the corresponding collectionClient and set the attributeDescription's
   * collectionClient property.
   * @param iAttrDescription {DG.AttributePlacementDescription}
   */
  collectionDidChange: function( iAttrDescription) {
    var tID = iAttrDescription.getPath('attribute.collection.id'),
        tClient = this.get('dataContext').getCollectionByID(tID);
    iAttrDescription.set('collectionClient', tClient);
  },

  /**
    @param{DG.Analysis.EAnalysisRole}
    @return{DG.AttributePlacementDescription}
  */
  firstAttributeDescriptionForRole: function( iRole) {
    return this.firstPlaceAndAttributeDescriptionForRole( iRole).attributeDescription;
  },
  
  /**
    @param{DG.Analysis.EAnalysisRole}
    @return{DG.AttributePlacementDescription}
  */
  firstAttributeIDForRole: function( iRole) {
    var tResult = this.firstPlaceAndAttributeDescriptionForRole( iRole);
    return tResult.attributeDescription.get('attributeID');
  },
  
  /**
    @param{DG.Analysis.EAnalysisRole}
    @return{DG.GraphTypes.EPlace}
  */
  getPlaceForRole: function( iRole) {
    return this.firstPlaceAndAttributeDescriptionForRole( iRole).place;
  },
  
  xAttributeID: function() {
    return this.getPath('xAttributeDescription.attributeID');
  }.property(),
  
  yAttributeID: function() {
    return this.getPath('yAttributeDescription.attributeID');
  }.property(),

  y2AttributeID: function() {
    return this.getPath('y2AttributeDescription.attributeID');
  }.property(),

  legendAttributeID: function() {
    return this.getPath('legendAttributeDescription.attributeID');
  }.property(),

  xAttributeIDDidChange: function() {
    this.notifyPropertyChange('xAttributeID');
  }.observes('*xAttributeDescription.attributeID'),
  
  yAttributeIDDidChange: function() {
    this.notifyPropertyChange('yAttributeID');
  }.observes('*yAttributeDescription.attributeID'),
  
  y2AttributeIDDidChange: function() {
    this.notifyPropertyChange('y2AttributeID');
  }.observes('*y2AttributeDescription.attributeID'),
  
  legendAttributeIDDidChange: function() {
    this.notifyPropertyChange('legendAttributeID');
  }.observes('*legendAttributeDescription.attributeID'),
  
  /**
    @property {Boolean}
  */
  xIsNumeric: function() {
    return this.getPath('xAttributeDescription.isNumeric');
  }.property(),

  /**
    @property {Boolean}
  */
  yIsNumeric: function() {
    return this.getPath('yAttributeDescription.isNumeric');
  }.property(),

  /**
    @property {Boolean}
  */
  y2IsNumeric: function() {
    return this.getPath('y2AttributeDescription.isNumeric');
  }.property(),

  xIsNumericDidChange: function() {
    this.notifyPropertyChange('xIsNumeric');
  }.observes('*xAttributeDescription.isNumeric'),
  
  yIsNumericDidChange: function() {
    this.notifyPropertyChange('yIsNumeric');
  }.observes('*yAttributeDescription.isNumeric'),
  
  y2IsNumericDidChange: function() {
    this.notifyPropertyChange('y2IsNumeric');
  }.observes('*y2AttributeDescription.isNumeric'),
  
  /**
    @property {DG.Analysis.EAttributeType}
  */
  xType: function() {
    return this.getPath('xAttributeDescription.attributeType');
  }.property(),

  /**
    @property {DG.Analysis.EAttributeType}
  */
  yType: function() {
    return this.getPath('yAttributeDescription.attributeType');
  }.property(),

  /**
    @property {DG.Analysis.EAttributeType}
  */
  y2Type: function() {
    return this.getPath('y2AttributeDescription.attributeType');
  }.property(),

  xTypeDidChange: function() {
    this.notifyPropertyChange('xType');
  }.observes('*xAttributeDescription.attributeType'),
  
  yTypeDidChange: function() {
    this.notifyPropertyChange('yType');
  }.observes('*yAttributeDescription.attributeType'),
  
  y2TypeDidChange: function() {
    this.notifyPropertyChange('y2Type');
  }.observes('*y2AttributeDescription.attributeType'),
  
  /**
   * This property is never actually assigned. It is used only as a notification bottleneck
   * @property { null }
   */
  attributeAssignment: null,

  /**
   * @result {Boolean}
   */
  hasAtLeastOneAttributeAssigned: function() {
    return ['x', 'y', 'legend'].some( function( iKey) {
      return !this.getPath( iKey + 'AttributeDescription.isNull');
    }.bind( this));
  },
  
  /**
    Returns true if this graph references attributes in collections with aggregate
    functions, which is useful when determining whether a graph needs to be redrawn.
    @property   {Boolean}
   */
  hasAggregates: function() {
    var collectionIDs = {},
        foundID,
    
        /**
          Utility function used to help identify the minimum set of collections that
          have to be checked for aggregate functions. Since most graphs refer to 
          attributes for a single collection, there's no point in redundantly checking
          for aggregates in the same collection due to multiple attribute references.
          Adds the specified collection to the collectionIDs local variable map.
          @param    {String}  iDescriptor -- 'x', 'y', 'legend'
         */
        considerCollection = function( iDescriptor) {
          var collection = this.getPath( iDescriptor + 'AttributeDescription.collectionClient'),
              collectionID = collection && collection.get('id');
          if( !SC.none( collectionID))
            collectionIDs[ collectionID] = collection;
        }.bind( this);
    
    // Consider each of our possible collections in turn
    considerCollection('x');
    considerCollection('y');
    considerCollection('legend');
    
    // Search through our set of collections, stopping on the first one that has aggregates.
    foundID = DG.ObjectMap.findKey( collectionIDs,
                                    function( iCollectionID, iCollection) {
                                      return iCollection && iCollection.get('hasAggregates');
                                    });
    return !SC.none( foundID);
  }.property(),

  yAttributeIDAt: function( iIndex) {
    return this.get('yAttributeDescription' ).attributeIDAt( iIndex);
  },

  y2AttributeIDAt: function( iIndex) {
    return this.get('y2AttributeDescription' ).attributeIDAt( iIndex);
  },

  /**
   * @property {Array}
   */

  _hiddenCases: null,

  hiddenCases: function(iKey, iValue) {
    if( iValue) {
      this._hiddenCases = iValue;
      this.invalidateCaches();
    }
    return this._hiddenCases;
  }.property(),

  /**
    Initialization function
   */
  init: function() {
    sc_super();
    this._hiddenCases = [];
    DG.globalsController.addObserver('globalValueChanges', this, 'globalValueDidChange');
  },

  destroy: function() {
    var xDesc = this.get('xAttributeDescription'),
        yDesc = this.get('yAttributeDescription'),
        y2Desc = this.get('y2AttributeDescription'),
        legDesc = this.get('legendAttributeDescription');

    if( xDesc)
      xDesc.removeObserver('collectionClient', this, 'xCollectionDidChange');
    if( yDesc)
      yDesc.removeObserver('collectionClient', this, 'yCollectionDidChange');
    if( y2Desc)
      y2Desc.removeObserver('collectionClient', this, 'y2CollectionDidChange');
    if( legDesc)
      legDesc.removeObserver('collectionClient', this, 'legendCollectionDidChange');

    this.get('attributesByPlace').forEach(function( iAttrDesc) {
      iAttrDesc.removeObserver('collection', this, 'collectionDidChange');
    }.bind( this));

    this._hiddenCases = [];  // For good measure
    DG.globalsController.removeObserver('globalValueChanges', this, 'globalValueDidChange');

    sc_super();
  },
  
  /**
    Sets the specified attribute for the specified attribute description,
    e.g. puts the specified attribute in the appropriate place for an axis.
    If iAttrRefs is null, then the specified place is cleared of any attribute.
    @param {String} iDescription -- e.g. 'xAttributeDescription' or 'yAttributeDescription'
    @param {Object}               iAttrRefs -- the attribute to set
           {DG.CollectionClient}  iAttrRefs.collection -- the collection containing the specified attribute
           {Array of DG.Attribute}iAttrRefs.attributes -- the attributes to set
    @param {DG.Analysis.EAnalysisRole} iRole Optional
    @param {DG.Analysis.EAttributeType} iType Optional

   //TODO: In the long run we need to be able to accommodate attributes from different levels
      in the collection hierarchy, so iAttrRefs will need to consist of an array of collection/attribute pairs.
   */
  setAttributeAndCollectionClient: function( iDescription, iAttrRefs, iRole, iType) {
    var tDescription = this.get( iDescription);
    //tDescription.invalidateCaches();  // So that notification order won't be important
    tDescription.removeAllAttributes();
    tDescription.beginPropertyChanges();
      tDescription.set('collectionClient', (iAttrRefs && iAttrRefs.collection) || null);
      if( !SC.none( iAttrRefs)) {
        iAttrRefs.attributes.forEach( function( iAttribute) {
          tDescription.addAttribute( iAttribute);
        });
      }
      if(!SC.none( iRole))
        tDescription.set('role', iRole);
      if(!SC.none( iType))
        tDescription.setPath('attributeStats.attributeType', iType);
      else {
        var tType = tDescription.get('isNumeric') ? DG.Analysis.EAttributeType.eNumeric :
                                                    DG.Analysis.EAttributeType.eCategorical;
        tDescription.setPath('attributeStats.attributeType', tType);
      }
    this._casesCache = null;
    tDescription.invalidateCaches( this.get('cases'));  // So that notification order won't be important
    tDescription.endPropertyChanges();
  },

  /**
   * Change the attribute type on the given axis, so the Graph treats it differently than it's native data type.
   * @param iDescriptionKey {String} to get our {DG.AttributePlacementDescription}
   * @param iTreatAsNumeric {Boolean} numeric or categorical
   */
  setAttributeType: function( iDescriptionKey, iTreatAsNumeric ) {
    DG.assert( typeof iDescriptionKey === 'string' );
    DG.assert( typeof iTreatAsNumeric === 'boolean' );
    var tDescription = this.get( iDescriptionKey),
        tType =( iTreatAsNumeric ? DG.Analysis.EAttributeType.eNumeric : DG.Analysis.EAttributeType.eCategorical ),
        tAttribute = tDescription && tDescription.get('attribute'),
        tStats = tDescription && tDescription.get( 'attributeStats');
    DG.assert( tAttribute !== DG.Analysis.kNullAttribute );
    tDescription.invalidateCaches( this.get('cases'));  // So that notification order won't be important
    if( tStats ) tStats.set('attributeType', tType);
  },
  
  /**
   * Choose one collection to treat as the child collection.
   * If there is no parent/child relationship, just pick a collection.
   * @param {DG.CollectionClient}
   * @param {DG.CollectionClient}
   */
  chooseChildCollection: function( iCC1, iCC2) {
    var tContext = this.get('dataContext'),
        tCollections = tContext ? tContext.get('collections') : [],
        tCC1Index = iCC1 ? tCollections.indexOf( iCC1.get('collection')) : -1,
        tCC2Index = iCC2 ? tCollections.indexOf( iCC2.get('collection')) : -1;

    return (tCC1Index > tCC2Index) ? iCC1 : iCC2;
  },

  /**
   * @return {Array of Integer }
   */
  plottedCollectionIDs: function() {
    var plottedCollectionIDs = [],
        collectionClient = this.get('collectionClient'),
        collectionClientID = collectionClient && collectionClient.get('id'),
        // Temporary elimination of legend because it can cause inclusion of unwanted cases
        properties = ['xCollectionClient', 'yCollectionClient', 'y2CollectionClient'/*, 'legendCollectionClient'*/];
    if( collectionClient && !SC.none( collectionClientID))
      plottedCollectionIDs.push( collectionClientID);

    properties.forEach( function( iProperty) {
      var collection = this.get( iProperty),
          collectionID = collection && collection.get('id');
      if( !SC.none( collectionID)) {
        if( plottedCollectionIDs.indexOf( collectionID) < 0)
          plottedCollectionIDs.push( collectionID);
      }
    }.bind( this));
    return plottedCollectionIDs;
  }.property('collectionClient','xCollectionClient',
              'yCollectionClient','y2CollectionClient','legendCollectionClient').cacheable(),

  _casesCache: null, // Array of DG.Case

  /**
   * @property {SC.Array of DG.Case} All cases, both hidden and visible
   */
  allCases: function() {
    // By returning a source regardless of whether the two collection clients are the same
    //  or not, we make it possible to make a plot in which the attribute on the x-axis
    //  is from a child collection and the one on the y-axis is from the parent. Ideally,
    //  we determine which of the two is the child and then the child can be on the y-axis.
    var tSource = this.get('collectionClient') ||
                    DG.currDocumentController().collectionDefaults().collectionClient;
    return tSource ? tSource.getPath('casesController.arrangedObjects') : null;
  }.property(),

  /**
    @property { Function that returns SC.Array of DG.Case }
  */
  cases: function() {
    if( SC.none( this._casesCache)) {
      var tCases = this.get('allCases'),
          tHidden = this.get( 'hiddenCases' ),
          tNotHidden,
          tResult = [],
          tVarIDs = [],
          tAttributesByPlace = this.get('attributesByPlace');
      if( tCases) {
        // We subtract the hidden cases so that they are not known about by the graph
        tNotHidden = DG.ArrayUtils.subtract( tCases, tHidden,
                      function( iCase) {
                        return iCase.get('id');
                      });

        // Only include cases that have values of x and y attributes (if such exist)
        // TODO: Do the right thing for plots that use a y2 attribute.
        [ DG.GraphTypes.EPlace.eX, DG.GraphTypes.EPlace.eY].forEach( function( iPlace) {
          tAttributesByPlace[ iPlace].forEach( function( iDescription) {
            var tAttrID = iDescription.get('attributeID');
            if(!SC.none( tAttrID))
              tVarIDs.push( tAttrID);
          });
        });

        // We don't return cases that are missing a value for an x or y attribute
        tNotHidden.forEach( function( iCase) {
          var tValid = true;
          tVarIDs.forEach( function( iID) {
            if( !iCase.hasValue( iID))
              tValid = false;
          });
          if( tValid)
            tResult.push( iCase);
        });
      }
      this._casesCache = tResult;
    }
    return this._casesCache;
  }.property('xCollectionClient','yCollectionClient', 'legendCollectionClient'),

  /**
   * @return {Number}
   */
  getCaseCount: function() {
    return this.getPath('cases.length');
  },

  /**
   * Remove the hidden cases from my collection client's selection
   */
  selection: function() {
    var tSelection = this.getPath('collectionClient.casesController.selection' );
    tSelection = tSelection ? tSelection.toArray() : [];
    return DG.ArrayUtils.subtract( tSelection, this.get('hiddenCases'),
                                    function( iCase) {
                                      return iCase.get('id');
                                    });
  }.property('xCollectionClient','yCollectionClient','y2CollectionClient', 'legendCollectionClient', 'hiddenCases'),

  /**
   * Bottleneck for detecting attribute assignment change
   */
  attributeAssignmentDidChange: function() {
    this.notifyPropertyChange('attributeAssignment');
  }.observes('.xAttributeDescription.attribute', '.yAttributeDescription.attribute', '.y2AttributeDescription.attribute',
      '.legendAttributeDescription.attribute'),

  /**
    Iteration through all attribute descriptions.
    @param{Function} with signature (DG.AttributePlacementDescription)
  */
  forEachAttribute: function( iDoF) {
    this.get('attributesByPlace').forEach( function( iArray) {
        iArray.forEach( iDoF);
      });
  },
  
  /**
    Return the first attribute description for which iTestF returns true.
    @param{Function} with signature (DG.AttributePlacementDescription) returning Boolean
    @return {{attributeDescription: {DG.AttributePlacementDescription}, 
              place: {DG.Analysis.EPlace} }}
  */
  firstAttributeDescriptionSuchThat: function( iTestF) {
    var tAttributesByPlace = this.get('attributesByPlace'),
        tNumPlaces = tAttributesByPlace.length,
        tPlace;
    for( tPlace = 0; tPlace < tNumPlaces; tPlace++) {
      var tAttributeArray = tAttributesByPlace[ tPlace],
          tLength = !SC.none( tAttributeArray) ? tAttributeArray.length : 0,
          tIndex;
      for( tIndex = 0; tIndex < tLength; tIndex++) {
        if( iTestF( tAttributeArray[ tIndex]))
          return { attributeDescription: tAttributeArray[ tIndex],
                  place: tPlace };
      }
    }
    return { attributeDescription: null, place: DG.GraphTypes.EPlace.eUndefined };
  },
  
  /**
    @param{DG.Analysis.EAnalysisRole}
    @return{{attributeDescription: {DG.AttributePlacementDescription}, 
              place: {DG.Analysis.EPlace} }}
  */
  firstPlaceAndAttributeDescriptionForRole: function( iRole) {
    return this.firstAttributeDescriptionSuchThat( function( iDesc) {
        return iDesc.get('role') === iRole;
      });
  },

  /**
   * Utility method
   */
  invalidateAxisDescriptionCaches: function( iCases, iChange) {
    this.get('xAttributeDescription').invalidateCaches( iCases, iChange);
    this.get('yAttributeDescription').invalidateCaches( iCases, iChange);
    if( this.get('y2AttributeDescription'))
      this.get('y2AttributeDescription').invalidateCaches( iCases, iChange);
    this.get('legendAttributeDescription').invalidateCaches( iCases, iChange);

 },
  
  /**
    Pass along to attribute descriptions
  */
  invalidateCaches: function( iCases, iChange) {
    var tCases;
    if( !iCases && iChange && this._casesCache &&
        ((iChange.operation === 'createCase') || (iChange.operation === 'createCases'))) {

      // If the change is from a collection other than one we care about, bail
      var tChangedCollectionID = iChange.collection && iChange.collection.get('id');
      if( tChangedCollectionID && (this.get( 'plottedCollectionIDs').indexOf( tChangedCollectionID) < 0))
        return;

      var caseIDs = iChange.result.caseIDs || [ iChange.result.caseID ];
      caseIDs.forEach( function( iCaseID) {
                          var tNewCase = this.dataContext.getCaseByID(iCaseID);
                          if( tNewCase)
                            this._casesCache.push( tNewCase);
                        }.bind( this));
      tCases = this._casesCache;
    }
    else {
      this._casesCache = null;
      tCases = iCases || this.get('cases');
    }
    this.invalidateAxisDescriptionCaches( tCases, iChange);
  },

  hiddenCasesDidChange: function() {
    this._casesCache = null;
    this.invalidateAxisDescriptionCaches();
  }.observes('hiddenCases'),

  /**
   * Set up to trigger during init
   */
  globalValueDidChange:function() {
    if( this.atLeastOneFormula())
      this.invalidateCaches();
  },

  /**
   * Something has happened such that cases have been deleted. Some cases in our hiddenCases array
   * may be among those deleted. We need to remove them.
   */
  synchHiddenCases: function () {
    var tHidden = this.get('hiddenCases'),
        tNoLongerPresent = tHidden.filter(function (iCase) {
          var tFound = DG.store.find(DG.Case, iCase.get('id'));
          return SC.none(tFound);
        });
    if( tNoLongerPresent.length > 0) {
      this.set('hiddenCases', DG.ArrayUtils.subtract(tHidden, tNoLongerPresent,
          function( iCase) {
            return iCase.get('id');
          }));
    }
  },

  /**
    @property { Array of SC.Array }
  */
  arrangedObjectArrays: function() {
    var tXVarCC = this.get('xCollectionClient'),
        tYVarCC = this.get('yCollectionClient'),
        tLegVarCC = this.get('legendCollectionClient'),
        tY2VarCC = this.get('y2CollectionClient'),
        tArrays = !SC.none( tXVarCC) ? [ tXVarCC.casesController.arrangedObjects()] : [];
    if( (tXVarCC !== tYVarCC) && !SC.none( tYVarCC))
      tArrays.push( tYVarCC.casesController.arrangedObjects());
    if (!SC.none( tLegVarCC) && (tLegVarCC !== tXVarCC) && (tLegVarCC !== tYVarCC))
      tArrays.push( tLegVarCC.casesController.arrangedObjects());
    if (!SC.none( tY2VarCC) && (tY2VarCC !== tXVarCC) && (tY2VarCC !== tYVarCC) && (tY2VarCC !== tLegVarCC))
      tArrays.push( tY2VarCC.casesController.arrangedObjects());

    // In the situation in which there is not an x or a y or a legend collection client, we still want to
    // have arranged objects so that the "empty" plot will work
    if( tArrays.length === 0) {
      var tCC = DG.currDocumentController().collectionDefaults().collectionClient;
      if( tCC)
        tArrays.push( tCC.casesController.arrangedObjects());
    }
    
    return tArrays;
  }.property('xCollectionClient', 'yCollectionClient', 'legendCollectionClient'),
  
  /**
    @param { DG.GraphTypes.EPlace }
    @return{ {min:{Number}, max:{Number} isDataInteger:{Boolean}} }
  */
  getDataMinAndMaxForDimension: function( iDimension) {
    var tAttributeDescription;
    switch( iDimension) {
      case DG.GraphTypes.EPlace.eX:
        tAttributeDescription = this.get('xAttributeDescription');
        break;
      case DG.GraphTypes.EPlace.eY:
        tAttributeDescription = this.get('yAttributeDescription');
        break;
      case DG.GraphTypes.EPlace.eY2:
        tAttributeDescription = this.get('y2AttributeDescription');
        break;
      case DG.GraphTypes.EPlace.eLegend:
        tAttributeDescription = this.get('legendAttributeDescription');
        break;
    }
    return tAttributeDescription.getPath('attributeStats.minMax');
  },

  /**
   *
   * @returns {Boolean}
   */
  atLeastOneFormula: function() {
    var tProperties = ['xAttributeDescription', 'yAttributeDescription', 'legendAttributeDescription'];
    return tProperties.some( function( iProperty) {
      return this.getPath(iProperty + '.hasFormula');
    }.bind(this));
  },

  /**
   * The given array of cases will be concatenated with the current array of hidden cases.
   * By using 'set' we trigger notification for observers.
   * @param iArrayOfCases
   */
  hideCases: function( iArrayOfCases) {
    this.set('hiddenCases', this.get('hiddenCases' ).concat( iArrayOfCases ).uniq());
  },
  
  /**
   * The given array of cases will be subtracted from the current array of hidden cases.
   * By using 'set' we trigger notification for observers.
   * @param iArrayOfCases
   */
  showCases: function( iArrayOfCases) {
    this.set('hiddenCases', DG.ArrayUtils.subtract( this.get('hiddenCases' ), iArrayOfCases,
                                                    function( iCase) {
                                                      return iCase.get('id');
                                                    } )
    );
  },

  /**
   * Set hidden cases to the empty array.
   * By using 'set' we trigger notification for observers.
   */
  showAllCases: function() {
    this.set('hiddenCases', []);
  },

  /**
   * Called from GraphModel.restoreStorage
   * @param iArrayOfCaseIDs {Array} of {Number}
   */
  restoreHiddenCases: function( iArrayOfCaseIDs) {
    if(SC.none( iArrayOfCaseIDs))
      return;
    this.set('hiddenCases', iArrayOfCaseIDs.map( function( iID) {
                                  return this.dataContext.getCaseByID( iID);
                                }.bind(this)
    ));
  }

});

